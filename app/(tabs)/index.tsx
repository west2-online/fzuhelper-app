import { Tabs, useFocusEffect } from 'expo-router';
import { forwardRef, Suspense, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type LayoutRectangle,
  type ViewToken,
} from 'react-native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';

import { JwchCourseListResponse_Course } from '@/api/backend';
import { getApiV1FriendCourse, getApiV1UserFriendList } from '@/api/generate';
import { Icon } from '@/components/Icon';
import { CourseErrorBoundary } from '@/components/course/course-error-boundary';
import CourseWeek from '@/components/course/course-week';
import { FriendListModal } from '@/components/course/friend-list-modal';
import Loading from '@/components/loading';
import ErrorView from '@/components/multistateview/error-view';
import PageContainer from '@/components/page-container';
import PickerModal from '@/components/picker-modal';
import { queryClient } from '@/components/query-provider';
import { Text } from '@/components/ui/text';
import { CoursePageProvider } from '@/context/course-page';
import useApiRequest from '@/hooks/useApiRequest';
import { useCoursePageData } from '@/hooks/useCourseDataSuspense';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { hasCustomBackground } from '@/lib/appearance';
import { COURSE_PAGE_ALL_DATA_KEY, FRIEND_LIST_KEY } from '@/lib/constants';
import { CourseCache, forceRefreshCourseData, getCourseSetting } from '@/lib/course';
import { getFirstDateByWeek } from '@/lib/locate-date';
import { NotificationManager } from '@/lib/notification';

const CourseGrid = forwardRef(
  (
    {
      selectedFriendId,
      coursePageData,
      selectedWeek,
      onWeekChange,
    }: {
      selectedFriendId: string | undefined;
      coursePageData: any;
      selectedWeek: number;
      onWeekChange: (week: number) => void;
    },
    ref,
  ) => {
    const { currentTerm, maxWeek } = coursePageData;
    const [schedulesByDays, setSchedulesByDays] = useState(coursePageData.schedulesByDays);

    // 好友课表数据
    const {
      data: friendCourseData,
      isError: isFriendError,
      refetch: refetchFriend,
    } = useApiRequest(
      getApiV1FriendCourse,
      { student_id: selectedFriendId!, term: coursePageData.setting.selectedSemester },
      {
        enabled: !!selectedFriendId,
        queryKey: ['friend_course', selectedFriendId!, coursePageData.setting.selectedSemester],
      },
    );

    // 监听课表数据源变化（本人/好友/缓存刷新）
    useEffect(() => {
      if (selectedFriendId) {
        // 情况 A：查看好友课表，仅在数据成功返回时更新
        if (friendCourseData) {
          setSchedulesByDays(CourseCache.processFriendCourses(friendCourseData as JwchCourseListResponse_Course[]));
        }
      } else {
        // 情况 B：查看本人课表，立即同步并监听缓存刷新
        const syncOwnData = () =>
          setSchedulesByDays(CourseCache.getCachedData(coursePageData.setting.selectedSemester));

        syncOwnData();

        CourseCache.addRefreshListener(syncOwnData);
        return () => CourseCache.removeRefreshListener(syncOwnData);
      }
    }, [selectedFriendId, friendCourseData, coursePageData.setting.selectedSemester]);

    const { width } = useWindowDimensions();
    const [flatListLayout, setFlatListLayout] = useState<LayoutRectangle>({ width, height: 0, x: 0, y: 0 });

    const flatListRef = useRef<FlatList>(null);

    // 周数切换
    const safeSetSelectedWeek = useCallback(
      (week: number, scrollTo: boolean = true) => {
        const targetWeek = Math.max(1, Math.min(week, maxWeek));
        onWeekChange(targetWeek);
        if (scrollTo && flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: targetWeek - 1,
            animated: false,
          });
        }
      },
      [maxWeek, onWeekChange],
    );

    useImperativeHandle(ref, () => ({
      scrollToWeek: (week: number) => safeSetSelectedWeek(week),
    }));

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
            onWeekChange(firstViewableWeek);
          }
        }
      },
      [onWeekChange, selectedWeek],
    );

    // 提供固定的布局信息，有助于性能优化
    const getItemLayout = useCallback(
      (_: any, index: number) => ({
        length: width,
        offset: width * index,
        index,
      }),
      [width],
    );

    // 渲染列表项（此处一项为一屏的内容）
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

    // 好友课表加载失败时，在组件内展示错误视图，保持 header 可交互
    if (selectedFriendId && isFriendError) {
      return <ErrorView refresh={() => refetchFriend()} />;
    }

    return (
      <FlatList
        className="flex-1"
        ref={flatListRef}
        horizontal
        pagingEnabled
        data={weekArray}
        initialNumToRender={1} // 初始渲染数量，影响首屏速度
        windowSize={3} // 预加载窗口大小
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
    );
  },
);

CourseGrid.displayName = 'CourseGrid';

function HomePageContent({
  selectedFriendId,
  setSelectedFriendId,
}: {
  selectedFriendId: string | undefined;
  setSelectedFriendId: (id: string | undefined) => void;
}) {
  const coursePageData = useCoursePageData();
  const { currentWeek, maxWeek } = coursePageData;

  const [selectedWeek, setSelectedWeek] = useState(currentWeek === -1 ? 1 : Math.min(currentWeek, maxWeek));
  const [showWeekSelector, setShowWeekSelector] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [customBackground, setCustomBackground] = useState(false);

  const courseGridRef = useRef<{ scrollToWeek: (week: number) => void }>(null);

  useEffect(() => {
    const checkBackground = async () => {
      const result = await hasCustomBackground();
      setCustomBackground(result);
    };
    checkBackground();
  }, []);

  const { data: friendList, refetch } = useApiRequest(
    getApiV1UserFriendList,
    {},
    { persist: true, queryKey: [FRIEND_LIST_KEY] },
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const headerBackground = useCallback(() => {
    return !customBackground ? <View className="flex-1 bg-card" /> : undefined;
  }, [customBackground]);

  const headerLeft = useCallback(() => {
    const title = selectedFriendId
      ? `${friendList?.find(f => f.stu_id === selectedFriendId)?.name ?? '好友'}的课表`
      : '我的课表';

    let textSize = 'text-xl';
    let iconSize = 13;
    if (title.length > 8) {
      textSize = 'text-sm';
      iconSize = 9;
    } else if (title.length > 5) {
      textSize = 'text-base';
      iconSize = 11;
    }

    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => setMenuVisible(true)} className="w-32 flex-row items-center">
        <Text className={`ml-4 font-medium ${textSize}`}>{title}</Text>
        <Icon name="chevron-forward" size={iconSize} className="ml-0.5" />
      </TouchableOpacity>
    );
  }, [selectedFriendId, friendList]);

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
        {selectedFriendId === undefined && (
          <Icon href="/settings/custom-course" name="add-circle-outline" size={24} className="mr-6" />
        )}
        <Icon href="/settings/course" name="settings-outline" size={24} className="mr-4" />
      </>
    ),
    [selectedFriendId],
  );

  const weekPickerData = useMemo(
    () =>
      Array.from({ length: maxWeek }, (_, i) => ({
        value: String(i + 1),
        label: `第 ${i + 1} 周`,
      })),
    [maxWeek],
  );

  return (
    <CoursePageProvider value={{ setting: coursePageData.setting }}>
      <Tabs.Screen
        options={{
          headerBackground,
          headerLeft,
          headerTitle,
          headerRight,
        }}
      />

      <CourseGrid
        ref={courseGridRef}
        selectedFriendId={selectedFriendId}
        coursePageData={coursePageData}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
      />

      <PickerModal
        visible={showWeekSelector}
        title="选择周数"
        data={weekPickerData}
        value={String(selectedWeek)}
        onClose={() => setShowWeekSelector(false)}
        onConfirm={val => {
          setShowWeekSelector(false);
          courseGridRef.current?.scrollToWeek(parseInt(val, 10));
        }}
      />

      <FriendListModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        friendList={friendList}
        selectedFriendId={selectedFriendId}
        onSelectFriend={setSelectedFriendId}
      />
    </CoursePageProvider>
  );
}

export default function HomePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>(undefined);
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
          await queryClient.invalidateQueries({ queryKey: [COURSE_PAGE_ALL_DATA_KEY] });

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
      if (selectedFriendId) {
        // 刷新好友课表
        await queryClient.invalidateQueries({ queryKey: ['friend_course', selectedFriendId] });
      } else {
        // 刷新自己的课表
        const setting = await getCourseSetting();
        await forceRefreshCourseData(setting.selectedSemester);
        await queryClient.invalidateQueries({ queryKey: [COURSE_PAGE_ALL_DATA_KEY] });
      }
      setResetKey(prev => prev + 1);
    } catch (error: any) {
      console.error('Refresh failed:', error);
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, selectedFriendId, handleError]);

  return (
    <PageContainer refreshBackground>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerClassName="flex-1"
      >
        <CourseErrorBoundary
          key={resetKey}
          onReset={() => {
            queryClient.resetQueries({ queryKey: [COURSE_PAGE_ALL_DATA_KEY] });
            setResetKey(prev => prev + 1);
          }}
        >
          <Suspense fallback={<Loading />}>
            <HomePageContent selectedFriendId={selectedFriendId} setSelectedFriendId={setSelectedFriendId} />
          </Suspense>
        </CourseErrorBoundary>
      </ScrollView>
    </PageContainer>
  );
}
