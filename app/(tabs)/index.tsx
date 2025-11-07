import { Tabs, useFocusEffect } from 'expo-router';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions, type LayoutRectangle, type ViewToken } from 'react-native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import { toast } from 'sonner-native';

import { Icon } from '@/components/Icon';
import { CourseErrorBoundary } from '@/components/course/course-error-boundary';
import CourseWeek from '@/components/course/course-week';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import PickerModal from '@/components/picker-modal';
import { queryClient } from '@/components/query-provider';
import { Text } from '@/components/ui/text';
import { CoursePageProvider } from '@/context/course-page';
import { useCoursePageData } from '@/hooks/useCourseDataSuspense';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { hasCustomBackground } from '@/lib/appearance';
import { CourseCache, forceRefreshCourseData, getCourseSetting } from '@/lib/course';
import { getFirstDateByWeek } from '@/lib/locate-date';
import { NotificationManager } from '@/lib/notification';

function CoursePage() {
  const coursePageData = useCoursePageData();
  const { currentWeek, currentTerm, maxWeek } = coursePageData;

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

  const [selectedWeek, setSelectedWeek] = useState(currentWeek === -1 ? 1 : Math.min(currentWeek, maxWeek));
  const [showWeekSelector, setShowWeekSelector] = useState(false);
  const { width } = useWindowDimensions();
  const [flatListLayout, setFlatListLayout] = useState<LayoutRectangle>({ width, height: 0, x: 0, y: 0 });
  const [customBackground, setCustomBackground] = useState(false);

  useEffect(() => {
    const checkBackground = async () => {
      const result = await hasCustomBackground();
      setCustomBackground(result);
    };
    checkBackground();
  }, []);

  const flatListRef = useRef<FlatList>(null);

  // 周数切换
  const safeSetSelectedWeek = useCallback(
    (week: number, scrollTo: boolean = true) => {
      const targetWeek = Math.max(1, Math.min(week, maxWeek));
      setSelectedWeek(targetWeek);
      if (scrollTo && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: targetWeek - 1,
          animated: false,
        });
      }
    },
    [maxWeek],
  );

  // 生成周数据
  const weekArray = useMemo(
    () =>
      Array.from({ length: maxWeek }, (_, i) => ({
        week: i + 1,
        firstDate: getFirstDateByWeek(currentTerm.start_date, i + 1),
      })),
    [maxWeek, currentTerm],
  );

  // 通过 viewability 回调获取当前周
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<(typeof weekArray)[0]>[] }) => {
      if (viewableItems.length > 0) {
        const firstViewableWeek = viewableItems[0].item.week;
        if (firstViewableWeek !== selectedWeek) {
          safeSetSelectedWeek(firstViewableWeek, false);
        }
      }
    },
    [safeSetSelectedWeek, selectedWeek],
  );

  const weekPickerData = useMemo(
    () =>
      Array.from({ length: maxWeek }, (_, i) => ({
        value: String(i + 1),
        label: `第 ${i + 1} 周`,
      })),
    [maxWeek],
  );

  const headerBackground = useCallback(() => {
    return !customBackground ? <View className="flex-1 bg-card" /> : undefined;
  }, [customBackground]);

  const headerLeft = useCallback(
    () => (
      <Pressable
        onPress={() => {
          if (currentWeek !== -1) {
            safeSetSelectedWeek(currentWeek);
          }
        }}
      >
        <Text className="ml-4 text-2xl font-medium">课程表</Text>
      </Pressable>
    ),
    [safeSetSelectedWeek, currentWeek],
  );

  const headerTitle = useCallback(
    () => (
      <Pressable onPress={() => setShowWeekSelector(!showWeekSelector)} className="flex flex-row items-center">
        <Text className="mr-1 text-lg">
          第 {selectedWeek} 周 {selectedWeek === currentWeek ? '(本周)' : ''}
        </Text>
        <Icon name={showWeekSelector ? 'caret-up-outline' : 'caret-down-outline'} size={10} />
      </Pressable>
    ),
    [selectedWeek, currentWeek, showWeekSelector],
  );

  const headerRight = useCallback(
    () => (
      <>
        <Icon href="/settings/custom-course" name="add-circle-outline" size={24} className="mr-6" />
        <Icon href="/settings/course" name="settings-outline" size={24} className="mr-4" />
      </>
    ),
    [],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const renderItem = useCallback(
    ({ item }: { item: { week: number; firstDate: string } }) => (
      <CourseWeek
        key={item.week}
        week={item.week}
        startDate={item.firstDate}
        schedulesByDays={schedulesByDays}
        flatListLayout={flatListLayout}
      />
    ),
    [schedulesByDays, flatListLayout],
  );

  const onLayout = useCallback(({ nativeEvent }: { nativeEvent: { layout: LayoutRectangle } }) => {
    setFlatListLayout(nativeEvent.layout);
  }, []);

  const onClose = useCallback(() => {
    setShowWeekSelector(false);
  }, []);

  const onConfirm = useCallback(
    (selectedValue: string) => {
      setShowWeekSelector(false);
      safeSetSelectedWeek(parseInt(selectedValue, 10));
    },
    [safeSetSelectedWeek],
  );

  return (
    <CoursePageProvider
      value={{
        setting: coursePageData.setting,
      }}
    >
      {/* 顶部 Tab 导航栏 */}
      <Tabs.Screen
        options={{
          headerBackground,
          headerLeft,
          headerTitle,
          headerRight,
        }}
      />

      {/* 课程表详情 */}
      <FlatList
        className="flex-1"
        ref={flatListRef}
        horizontal
        pagingEnabled
        data={weekArray}
        initialNumToRender={1}
        windowSize={3}
        getItemLayout={getItemLayout}
        initialScrollIndex={selectedWeek - 1}
        renderItem={renderItem}
        onLayout={onLayout}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        showsHorizontalScrollIndicator={false}
      />

      {/* 周数选择器 */}
      <PickerModal
        visible={showWeekSelector}
        title="选择周数"
        data={weekPickerData}
        value={String(selectedWeek)}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </CoursePageProvider>
  );
}

export default function HomePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const prevSettingsRef = useRef<string | null>(null);

  const { handleError } = useSafeResponseSolve();

  // 初始化通知管理器
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

  // 监听页面 focus，检测设置变化
  useFocusEffect(
    useCallback(() => {
      const checkSettingsChange = async () => {
        const currentSettings = await getCourseSetting();
        const currentSettingsStr = JSON.stringify(currentSettings);

        // 首次加载时保存设置
        if (prevSettingsRef.current === null) {
          prevSettingsRef.current = currentSettingsStr;
          return;
        }

        // 检测设置是否变化
        if (prevSettingsRef.current !== currentSettingsStr) {
          console.log('Settings changed, invalidating cache');
          prevSettingsRef.current = currentSettingsStr;

          // 使 React Query 缓存失效，触发重新加载
          await queryClient.invalidateQueries({ queryKey: ['course-page-all-data'] });

          // 重置组件（触发 Suspense 重新渲染）
          setResetKey(prev => prev + 1);
        }
      };

      checkSettingsChange();
    }, []),
  );

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
            <CoursePage key={resetKey} />
          </Suspense>
        </CourseErrorBoundary>
      </ScrollView>
    </PageContainer>
  );
}
