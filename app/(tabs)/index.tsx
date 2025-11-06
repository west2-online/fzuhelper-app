import { Suspense, useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import { toast } from 'sonner-native';

import { CourseErrorBoundary } from '@/components/course/course-error-boundary';
import CoursePage from '@/components/course/course-page';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { queryClient } from '@/components/query-provider';
import { CoursePageContext } from '@/context/course-page';
import { useCoursePageData } from '@/hooks/useCourseDataSuspense';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { CourseCache, forceRefreshCourseData, getCourseSetting } from '@/lib/course';
import { NotificationManager } from '@/lib/notification';

function CoursePageDataLoader() {
  const coursePageData = useCoursePageData();

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['course-page-all-data'] });
  }, []);

  const [schedulesByDays, setSchedulesByDays] = useState(coursePageData.schedulesByDays);

  useEffect(() => {
    const refreshHandler = () => {
      setSchedulesByDays(CourseCache.getCachedData(coursePageData.setting.selectedSemester));
    };
    CourseCache.addRefreshListener(refreshHandler);
    return () => {
      CourseCache.removeRefreshListener(refreshHandler);
    };
  }, [coursePageData.setting.selectedSemester]);

  const contextValue = {
    ...coursePageData,
    schedulesByDays,
    refetch,
  };

  return (
    <CoursePageContext value={contextValue}>
      <CoursePage />
    </CoursePageContext>
  );
}

export default function HomePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const { handleError } = useSafeResponseSolve();

  useEffect(() => {
    const initNotification = setTimeout(async () => {
      try {
        await NotificationManager.register();
        console.log('NotificationManager registered end.');
      } catch (error) {
        console.error('Failed to register NotificationManager:', error);
      }
    }, 2000);

    return () => clearTimeout(initNotification);
  }, []);

  const onRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const setting = await getCourseSetting();
      const queryTerm = setting.selectedSemester;

      await forceRefreshCourseData(queryTerm);

      await queryClient.invalidateQueries({ queryKey: ['course-page-all-data'] });

      setResetKey(prev => prev + 1);
    } catch (error: any) {
      console.error('Refresh failed:', error);
      handleError(error);
      toast.error('刷新失败，请稍后再试');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, handleError]);

  return (
    <PageContainer refreshBackground>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerClassName="flex-1"
      >
        <CourseErrorBoundary onReset={() => setResetKey(prev => prev + 1)}>
          <Suspense fallback={<Loading />}>
            <CoursePageDataLoader key={resetKey} />
          </Suspense>
        </CourseErrorBoundary>
      </ScrollView>
    </PageContainer>
  );
}
