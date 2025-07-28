import { Tabs } from 'expo-router';
import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions, type LayoutRectangle, type ViewToken } from 'react-native';
import { toast } from 'sonner-native';

import { Icon } from '@/components/Icon';
import Loading from '@/components/loading';
import PickerModal from '@/components/picker-modal';
import { Text } from '@/components/ui/text';

import { getApiV1JwchClassroomExam, getApiV1JwchCourseList } from '@/api/generate';
import { COURSE_DATA_KEY, EXAM_ROOM_KEY, EXPIRE_ONE_DAY } from '@/lib/constants';
import { COURSE_TYPE, CourseCache, EXAM_TYPE, type CourseInfo } from '@/lib/course';
import { formatExamData } from '@/lib/exam-room';
import { deConvertSemester, getFirstDateByWeek } from '@/lib/locate-date';
import { LocalUser, USER_TYPE_POSTGRADUATE } from '@/lib/user';
import { fetchWithCache } from '@/utils/fetch-with-cache';

import { CoursePageContext } from '@/app/(tabs)';
import { hasCustomBackground } from '@/lib/appearance';
import CourseWeek from './course-week';

// 课程表页面
const CoursePage: React.FC = () => {
  const { setting, currentWeek, currentTerm, maxWeek } = useContext(CoursePageContext);

  const [selectedWeek, setSelectedWeek] = useState(currentWeek === -1 ? 1 : Math.min(currentWeek, maxWeek)); // 选中周数，非当前学期则定位到第一周
  const [showWeekSelector, setShowWeekSelector] = useState(false);
  const { width } = useWindowDimensions(); // 获取屏幕宽度
  const [flatListLayout, setFlatListLayout] = useState<LayoutRectangle>({ width, height: 0, x: 0, y: 0 }); // FlatList 的布局信息
  const [schedulesByDays, setSchedulesByDays] = useState<Record<number, CourseInfo[]>>([]); // 目前的课程数据，按天归类
  const [cacheInitialized, setCacheInitialized] = useState(false); // 缓存是否初始化
  const [needForceFetch, setNeedForceFetch] = useState(false); // 是否需要强制刷新
  const [customBackground, setCustomBackground] = useState(false);

  useEffect(() => {
    const checkBackground = async () => {
      const result = await hasCustomBackground();
      setCustomBackground(result);
    };
    checkBackground();
  }, []);

  const flatListRef = useRef<FlatList>(null);

  const safeSetSelectedWeek = useCallback(
    (week: number) => {
      console.log('Setting selected week:', week);
      if (week < 1) {
        setSelectedWeek(1);
      } else {
        setSelectedWeek(Math.min(week, maxWeek));
      }
    },
    [maxWeek],
  );

  // 【查询课程数据】
  // 使用含缓存处理的查询 hooks，这样当网络请求失败时，会返回缓存数据
  // 注：此时访问的是 west2-online 的服务器，而不是教务系统的服务器
  useEffect(() => {
    // 拉取新数据的函数
    const fetchData = async () => {
      try {
        // 异步获取联网课程数据
        let hasChanged = false; // 是否有数据变更
        const hasCache = CourseCache.hasCachedData(); // 先判断是否有缓存
        let queryTerm = currentTerm.term;
        if (LocalUser.getUser().type === USER_TYPE_POSTGRADUATE) {
          queryTerm = deConvertSemester(currentTerm.term);
        }
        const fetchedData = await fetchWithCache(
          [COURSE_DATA_KEY, queryTerm],
          () => getApiV1JwchCourseList({ term: queryTerm, is_refresh: false }),
          EXPIRE_ONE_DAY, // 缓存一天
        );

        // 如果没有缓存，或缓存数据和新数据不一致，则更新数据
        if (!hasCache || !CourseCache.compareDigest(COURSE_TYPE, fetchedData.data.data)) {
          CourseCache.setCourses(fetchedData.data.data);
          hasChanged = true;
        }

        // 若开启导入考场，则再拉取考场数据
        if (setting.exportExamToCourseTable) {
          const examData = await fetchWithCache(
            [EXAM_ROOM_KEY, queryTerm],
            () => getApiV1JwchClassroomExam({ term: queryTerm }),
            EXPIRE_ONE_DAY,
          );

          const mergedExamData = formatExamData(examData.data.data);
          if (mergedExamData.length > 0 && !CourseCache.compareDigest(EXAM_TYPE, mergedExamData)) {
            CourseCache.mergeExamCourses(mergedExamData, currentTerm.start_date, currentTerm.end_date);
            hasChanged = true;
          } else if (mergedExamData.length === 0) {
            // 如果没有考试数据，但之前有缓存，则清除考试数据缓存
            CourseCache.clearExamData();
            hasChanged = true;
          }
        }
        if (!hasCache || hasChanged) {
          setSchedulesByDays(CourseCache.getCachedData() ?? []);
        }
        if (hasCache && hasChanged) toast.info('课程数据已刷新');
        setNeedForceFetch(false);
      } catch (error: any) {
        console.error(error);
        toast.error('课程数据获取失败，请检查网络连接，将使用本地缓存');
      }
    };
    setSchedulesByDays(CourseCache.getCachedData() ?? []);
    fetchData();
    setCacheInitialized(prev => {
      // 如果先前已经初始化过，说明是切换周数，则需要重置周
      if (prev) {
        // 此时再进行滚动到指定周数，添加 NeedForceFetch 标记，强制刷新数据
        // 此时会让页面进入 Loading 状态
        setNeedForceFetch(true);
        safeSetSelectedWeek(currentWeek);
      }
      return true;
    });
  }, [
    currentWeek,
    safeSetSelectedWeek,
    setting.exportExamToCourseTable,
    currentTerm.term,
    currentTerm.start_date,
    currentTerm.end_date,
  ]);

  // 订阅刷新事件，触发时更新课程数据状态
  useEffect(() => {
    const refreshHandler = () => {
      setSchedulesByDays(CourseCache.getCachedData() ?? []);
    };
    CourseCache.addRefreshListener(refreshHandler);
    return () => {
      CourseCache.removeRefreshListener(refreshHandler);
    };
  }, []);

  // 生成一周的日期数据
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
          safeSetSelectedWeek(firstViewableWeek);
        }
      }
    },
    [safeSetSelectedWeek, selectedWeek],
  );

  // selectedWeek 变化时，FlatList 滚动到对应周
  useEffect(() => {
    flatListRef?.current?.scrollToIndex({
      index: selectedWeek - 1,
      animated: false,
    });
  }, [currentWeek, maxWeek, selectedWeek]);

  // 生成周数选择器的数据
  const weekPickerData = useMemo(
    () =>
      Array.from({ length: maxWeek }, (_, i) => ({
        value: String(i + 1),
        label: `第 ${i + 1} 周`,
      })),
    [maxWeek],
  );

  return !cacheInitialized || needForceFetch ? (
    <Loading />
  ) : (
    <>
      {/* 顶部 Tab 导航栏 */}
      <Tabs.Screen
        options={{
          // eslint-disable-next-line react/no-unstable-nested-components
          headerBackground: !customBackground ? () => <View className="flex-1 bg-card" /> : undefined,
          // headerStyle: { backgroundColor: customBackground ? 'transparent' :  },
          // eslint-disable-next-line react/no-unstable-nested-components
          headerLeft: () => (
            <Pressable
              onPress={() => {
                if (selectedWeek !== -1) {
                  // 如果是当前学期，点击快捷跳转到当前周
                  safeSetSelectedWeek(currentWeek);
                }
              }}
            >
              <Text className="ml-4 text-2xl font-medium">课程表</Text>
            </Pressable>
          ),
          // eslint-disable-next-line react/no-unstable-nested-components
          headerTitle: () => (
            <Pressable onPress={() => setShowWeekSelector(!showWeekSelector)} className="flex flex-row items-center">
              <Text className="mr-1 text-lg">
                第 {selectedWeek} 周 {selectedWeek === currentWeek ? '(本周)' : ''}
              </Text>
              <Icon name={showWeekSelector ? 'caret-up-outline' : 'caret-down-outline'} size={10} />
            </Pressable>
          ),
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <>
              <Icon href="/settings/custom-course" name="add-circle-outline" size={24} className="mr-6" />
              <Icon href="/settings/course" name="settings-outline" size={24} className="mr-4" />
            </>
          ),
        }}
      />

      {/* 课程表详情 */}
      <FlatList
        ref={flatListRef} // 绑定 ref
        horizontal // 水平滚动
        pagingEnabled // 分页滚动
        data={weekArray} // 数据源
        initialNumToRender={4} // 初始渲染数量
        windowSize={3} // 窗口大小
        getItemLayout={(_, index) => ({
          // 提供固定的布局信息
          length: flatListLayout.width, // 每个项的宽度
          offset: flatListLayout.width * index, // 每个项的起始位置
          index, // 当前索引
        })}
        initialScrollIndex={selectedWeek - 1} // 初始滚动位置
        // 渲染列表项（此处一项为一屏的内容）
        renderItem={({ item }) => (
          <CourseWeek
            key={item.week}
            week={item.week}
            startDate={item.firstDate}
            schedulesByDays={schedulesByDays}
            flatListLayout={flatListLayout}
          />
        )}
        onLayout={({ nativeEvent }) => setFlatListLayout(nativeEvent.layout)} // 获取 FlatList 的布局信息
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        showsHorizontalScrollIndicator={false} // 隐藏水平滚动条
      />

      {/* 周数选择器 */}
      <PickerModal
        visible={showWeekSelector}
        title="选择周数"
        data={weekPickerData}
        value={String(selectedWeek)}
        onClose={() => setShowWeekSelector(false)}
        onConfirm={selectedValue => {
          setShowWeekSelector(false);
          safeSetSelectedWeek(parseInt(selectedValue, 10));
        }}
      />
    </>
  );
};

export default memo(CoursePage);
