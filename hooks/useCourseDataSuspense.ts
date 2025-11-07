import { useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import type { TermsListResponse_Term } from '@/api/backend';
import { getApiV1JwchClassroomExam, getApiV1JwchCourseList, getApiV1TermsList } from '@/api/generate';
import type { CourseSetting } from '@/api/interface';
import { COURSE_DATA_KEY, COURSE_TERMS_LIST_KEY, EXAM_ROOM_KEY, EXPIRE_ONE_DAY } from '@/lib/constants';
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
 * 使用 Suspense 加载课表页面的所有数据（配置 + 课表数据）
 * 这个 hook 会自动触发 Suspense，在数据加载完成前暂停渲染
 */
export function useCoursePageData() {
  const { data } = useSuspenseQuery({
    queryKey: ['course-page-all-data'],
    queryFn: async (): Promise<CoursePageData> => {
      // 0. 确保缓存已加载（幂等操作，可以多次调用）
      await CourseCache.load();

      // 1. 加载学期数据
      const termsData = await fetchWithCache([COURSE_TERMS_LIST_KEY], () => getApiV1TermsList(), {
        staleTime: 7 * EXPIRE_ONE_DAY,
      });

      // 2. 定位当前日期
      const locateDateRes = await locateDate();

      // 3. 获取课表设置
      const setting = await getCourseSetting();
      const selectedSemester = setting.selectedSemester || locateDateRes.semester;

      // 4. 计算当前周（如果是历史学期则为-1）
      const currentWeek = locateDateRes.semester === selectedSemester ? locateDateRes.week : -1;

      // 5. 获取当前学期信息
      const currentTerm = termsData?.data?.data?.terms?.find(t => t.term === selectedSemester);

      if (!termsData || !currentTerm) {
        console.error('Failed to load term data: ', termsData, currentTerm);
        throw new Error('获取学期信息失败，请稍后再试');
      }

      // 6. 计算最大周数
      const maxWeek = getWeeksBySemester(currentTerm.start_date, currentTerm.end_date);

      // 7. 加载课表数据
      let queryTerm = currentTerm.term;
      if (LocalUser.getUser().type === USER_TYPE_POSTGRADUATE) {
        queryTerm = deConvertSemester(currentTerm.term);
      }

      // 8. 获取课程数据
      const hasCache = CourseCache.hasCachedData();
      let hasChanged = false;

      const fetchedData = await fetchWithCache(
        [COURSE_DATA_KEY, queryTerm],
        () => getApiV1JwchCourseList({ term: queryTerm, is_refresh: false }),
        { staleTime: EXPIRE_ONE_DAY },
      );

      // 如果没有缓存，或缓存数据和新数据不一致，则更新数据
      if (!hasCache || !CourseCache.compareDigest(COURSE_TYPE, fetchedData.data.data)) {
        CourseCache.setCourses(fetchedData.data.data);
        hasChanged = true;
      }

      // 9. 如果开启导入考场，则加载考场数据
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

      // 10. 获取课表数据
      const schedulesByDays = CourseCache.getCachedData(selectedSemester);

      // 11. 更新选中学期
      await updateCourseSetting({ selectedSemester });

      // 12. 提示数据刷新
      if (hasCache && hasChanged) {
        toast.info('课程数据已刷新');
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
