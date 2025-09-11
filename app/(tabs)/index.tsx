import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import CoursePage from '@/components/course/course-page';
import Loading from '@/components/loading';

import { getApiV1TermsList } from '@/api/generate';
import PageContainer from '@/components/page-container';
import { CoursePageContext, CoursePageContextProps } from '@/context/course-page';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { COURSE_TERMS_LIST_KEY, EXPIRE_ONE_DAY } from '@/lib/constants';
import { CourseCache, forceRefreshCourseData, getCourseSetting, updateCourseSetting } from '@/lib/course';
import locateDate, { getWeeksBySemester } from '@/lib/locate-date';
import { NotificationManager } from '@/lib/notification';
import { fetchWithCache } from '@/utils/fetch-with-cache';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import { toast } from 'sonner-native';

export default function HomePage() {
  const [coursePageContextProps, setCoursePageContextProps] = useState<CoursePageContextProps | null>(null);

  const [cacheInitialized, setCacheInitialized] = useState(false); // 缓存是否初始化

  const [isRefreshing, setIsRefreshing] = useState(false); // 是否下拉刷新

  const { handleError } = useSafeResponseSolve();

  // loadData 负责加载 config（课表配置）和 locateDateResult（定位日期结果）
  const loadConfigAndDateResult = useCallback(async () => {
    // const startTime = Date.now(); // 记录开始时间

    // 这个学期数据（不是课程数据，是学期的开始结束时间等信息）存本地就可以了，本地做个长时间的缓存，这玩意一学期变一次，保守一点缓 7 天把
    // 即使是研究生，也是用这个接口获取学期数据。
    const termsData = await fetchWithCache(
      [COURSE_TERMS_LIST_KEY],
      () => getApiV1TermsList(),
      { staleTime: 7 * EXPIRE_ONE_DAY }, // 缓存 7 天
    );

    let locateDateRes;
    try {
      locateDateRes = await locateDate();
    } catch (error: any) {
      console.log(error);
      handleError(error);
      toast.error('获取当前周失败，请稍后再试');
      return;
    }

    // 获取最新的课表设置
    const setting = await getCourseSetting();
    const selectedSemester = setting.selectedSemester || locateDateRes.semester;

    // 定位当前周，如果是历史学期（即和 locateDate 给出的学期不符），则为-1
    const currentWeek = locateDateRes.semester === selectedSemester ? locateDateRes.week : -1;

    // 获取当前学期信息
    const currentTerm = termsData?.data.data.terms.find(t => t.term === selectedSemester);

    if (!termsData || !currentTerm) {
      console.error('Failed to load term data: ', termsData, currentTerm);
      toast.error('获取学期信息失败，请稍后再试');
      return;
    }

    // 获取当前学期的最大周数
    const maxWeek = getWeeksBySemester(currentTerm.start_date, currentTerm.end_date);

    setCoursePageContextProps({
      setting,
      currentWeek,
      currentTerm,
      maxWeek,
    });

    // 更新选中学期，替换掉默认空值
    updateCourseSetting({ selectedSemester });
    // const endTime = Date.now(); // 记录结束时间
    // const elapsedTime = endTime - startTime; // 计算耗时
    // console.log(`loadData function took ${elapsedTime}ms to complete.`);
  }, [handleError]);

  // 当加载的时候会读取 COURSE_SETTINGS，里面有一个字段会存储当前选择的学期（不一定是最新学期）
  useFocusEffect(
    useCallback(() => {
      if (cacheInitialized) {
        loadConfigAndDateResult();
      }
    }, [cacheInitialized, loadConfigAndDateResult]),
  );

  useEffect(() => {
    // 确保缓存数据在首次加载时被初始化
    if (!cacheInitialized) {
      const initializeCache = async () => {
        await CourseCache.load(); // 加载缓存数据
        // 将 NotificationManager.register 放到后台运行
        setTimeout(async () => {
          try {
            await NotificationManager.register(); // 初始化通知
            console.log('NotificationManager registered end.');
          } catch (error) {
            console.error('Failed to register NotificationManager:', error);
          }
        }, 2000); // 延迟注册
        setCacheInitialized(true); // 设置缓存已初始化
      };
      initializeCache();
    }
  }, [cacheInitialized]);

  const onRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // 能下拉页面一定加载好了，所以不可能为空，直接从这里拿
      let queryTerm = coursePageContextProps!.setting.selectedSemester;
      // 清空当前上下文旧数据，显示Loading
      setCoursePageContextProps(null);
      // 强制刷新课程数据
      await forceRefreshCourseData(queryTerm);
      // 本页面重新初始化配置
      loadConfigAndDateResult();
      // toast.success('刷新成功');
    } catch (error: any) {
      console.log(error);
      handleError(error);
      // 刷新失败，显示缓存数据
      loadConfigAndDateResult();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, coursePageContextProps, loadConfigAndDateResult, handleError]);

  // 在 AsyncStorage 中，我们按照 COURSE_SETTINGS_KEY__{学期 ID} 的格式存储课表设置
  // 具体加载课程的逻辑在 CoursePage 组件中
  return coursePageContextProps ? (
    <PageContainer refreshBackground>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerClassName="flex-1"
      >
        <CoursePageContext value={coursePageContextProps}>
          <CoursePage />
        </CoursePageContext>
      </ScrollView>
    </PageContainer>
  ) : (
    <Loading />
  );
}
