import { useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import type { TermsListResponse_Term } from '@/api/backend';
import { getApiV1JwchClassroomExam, getApiV1JwchCourseList, getApiV1TermsList } from '@/api/generate';
import type { CourseSetting } from '@/api/interface';
import { queryClient } from '@/components/query-provider';
import {
  COURSE_DATA_KEY,
  COURSE_PAGE_ALL_DATA_KEY,
  COURSE_TERMS_LIST_KEY,
  EXAM_ROOM_KEY,
  EXPIRE_ONE_DAY,
} from '@/lib/constants';
import {
  COURSE_TYPE,
  CourseCache,
  EXAM_TYPE,
  getCourseSetting,
  updateCourseSetting,
  type CourseInfo,
} from '@/lib/course';
import { formatExamData } from '@/lib/exam-room';
import locateDate, { deConvertSemester, getWeeksBySemester } from '@/lib/locate-date';
import { LocalUser, USER_TYPE_POSTGRADUATE } from '@/lib/user';
import { fetchWithCache } from '@/utils/fetch-with-cache';

export interface CoursePageData {
  setting: CourseSetting;
  currentWeek: number;
  currentTerm: TermsListResponse_Term;
  maxWeek: number;
  schedulesByDays: Record<number, CourseInfo[]>;
}

/**
 * 加载课程和考场数据的辅助函数
 */
async function loadCourseAndExamData(
  queryTerm: string,
  setting: CourseSetting,
  currentTerm: TermsListResponse_Term,
): Promise<boolean> {
  let hasChanged = false;

  // 获取课程数据
  const fetchedData = await fetchWithCache(
    [COURSE_DATA_KEY, queryTerm],
    () => getApiV1JwchCourseList({ term: queryTerm, is_refresh: false }),
    { staleTime: EXPIRE_ONE_DAY },
  );

  // 如果缓存数据和新数据不一致，则更新数据
  if (!CourseCache.compareDigest(COURSE_TYPE, fetchedData.data.data)) {
    CourseCache.setCourses(fetchedData.data.data);
    hasChanged = true;
  }

  // 如果开启导入考场，则加载考场数据
  if (setting.exportExamToCourseTable) {
    try {
      const examData = await fetchWithCache(
        [EXAM_ROOM_KEY, queryTerm],
        () => getApiV1JwchClassroomExam({ term: queryTerm }),
        { staleTime: EXPIRE_ONE_DAY },
      );

      const formattedExamData = formatExamData(examData.data.data);
      if (!CourseCache.compareDigest(EXAM_TYPE, formattedExamData)) {
        CourseCache.mergeExamCourses(formattedExamData, currentTerm.start_date, currentTerm.end_date);
        hasChanged = true;
      }
    } catch (error) {
      console.error('Failed to load exam data:', error);
      // 考场数据加载失败不影响主流程
    }
  }

  return hasChanged;
}

/**
 * 使用 Suspense 加载课表页面的所有数据（配置 + 课表数据）
 * 这个 hook 会自动触发 Suspense，在数据加载完成前暂停渲染
 */
export function useCoursePageData() {
  const { data } = useSuspenseQuery({
    queryKey: [COURSE_PAGE_ALL_DATA_KEY],
    queryFn: async (): Promise<CoursePageData> => {
      // 0. 确保缓存已加载（幂等操作，可以多次调用）
      await CourseCache.load();

      // 1. 优先使用已持久化的学期数据（若无则请求）
      let termsData = queryClient.getQueryData<Awaited<ReturnType<typeof getApiV1TermsList>>>([COURSE_TERMS_LIST_KEY]);
      if (!termsData) {
        termsData = await fetchWithCache([COURSE_TERMS_LIST_KEY], () => getApiV1TermsList(), {
          staleTime: 7 * EXPIRE_ONE_DAY,
        });
      } else {
        // 后台异步刷新学期数据
        fetchWithCache([COURSE_TERMS_LIST_KEY], () => getApiV1TermsList(), {
          staleTime: 7 * EXPIRE_ONE_DAY,
        });
      }

      // 2. 获取当前日期和课表设置
      const [locateDateRes, setting] = await Promise.all([locateDate(), getCourseSetting()]);
      const selectedSemester = setting.selectedSemester || locateDateRes.semester;

      // 3. 获取当前学期信息
      const currentTerm = termsData?.data?.data?.terms?.find(
        t =>
          (LocalUser.getUser().type === USER_TYPE_POSTGRADUATE ? deConvertSemester(t.term) : t.term) ===
          selectedSemester,
      );
      if (!termsData || !currentTerm) {
        console.error('Failed to load term data: ', termsData, currentTerm);
        throw new Error('获取学期信息失败，请稍后再试');
      }

      // 4. 计算当前周数（历史学期为 -1）和最大周数
      const currentWeek = locateDateRes.semester === selectedSemester ? locateDateRes.week : -1;
      const maxWeek = getWeeksBySemester(currentTerm.start_date, currentTerm.end_date);

      // 5. 加载课表数据
      let queryTerm = currentTerm.term;
      if (LocalUser.getUser().type === USER_TYPE_POSTGRADUATE) {
        queryTerm = deConvertSemester(currentTerm.term);
      }

      // 6. 尝试使用缓存数据
      const cachedSchedules = CourseCache.getCachedData(selectedSemester);
      if (cachedSchedules) {
        // 后台异步刷新数据
        loadCourseAndExamData(queryTerm, setting, currentTerm)
          .then(hasChanged => {
            // 缓存更新后，回填页面查询数据
            if (hasChanged) {
              const updated = CourseCache.getCachedData(selectedSemester);
              queryClient.setQueryData<CoursePageData>([COURSE_PAGE_ALL_DATA_KEY], {
                setting,
                currentWeek,
                currentTerm,
                maxWeek,
                schedulesByDays: updated,
              });
              // 触发 CoursePage 的刷新监听器，确保 UI 更新
              CourseCache.refresh();
              toast.success('课程数据已更新');
            }
          })
          .catch(error => {
            console.error('Background refresh failed:', error);
          });
        // 同步确保选中学期写回设置
        await updateCourseSetting({ selectedSemester });
        return {
          setting,
          currentWeek,
          currentTerm,
          maxWeek,
          schedulesByDays: cachedSchedules,
        };
      }

      // 7. 无缓存：同步加载数据
      const hasChanged = await loadCourseAndExamData(queryTerm, setting, currentTerm);

      // 8. 获取课表数据
      const schedulesByDays = CourseCache.getCachedData(selectedSemester);

      // 9. 更新选中学期
      await updateCourseSetting({ selectedSemester });

      // 10. 提示数据刷新
      if (hasChanged) {
        toast.success('课程数据已更新');
      }

      return {
        setting,
        currentWeek,
        currentTerm,
        maxWeek,
        schedulesByDays,
      };
    },
    // 设置较短的 staleTime，因为我们希望每次进入页面都能检查数据更新
    staleTime: 30000, // 30秒
  });

  return data;
}
