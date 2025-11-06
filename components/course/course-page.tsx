import { Tabs } from 'expo-router';
import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions, type LayoutRectangle, type ViewToken } from 'react-native';

import { Icon } from '@/components/Icon';
import PickerModal from '@/components/picker-modal';
import { Text } from '@/components/ui/text';

import { getFirstDateByWeek } from '@/lib/locate-date';

import { CoursePageContext } from '@/context/course-page';
import { hasCustomBackground } from '@/lib/appearance';

import CourseWeek from './course-week';

const CoursePage: React.FC = () => {
  const { currentWeek, currentTerm, maxWeek, schedulesByDays } = useContext(CoursePageContext);

  const [selectedWeek, setSelectedWeek] = useState(currentWeek === -1 ? 1 : Math.min(currentWeek, maxWeek)); // 选中周数，非当前学期则定位到第一周
  const [showWeekSelector, setShowWeekSelector] = useState(false);
  const { width } = useWindowDimensions(); // 获取屏幕宽度
  const [flatListLayout, setFlatListLayout] = useState<LayoutRectangle>({ width, height: 0, x: 0, y: 0 }); // FlatList 的布局信息
  const [customBackground, setCustomBackground] = useState(false);

  useEffect(() => {
    const checkBackground = async () => {
      const result = await hasCustomBackground();
      setCustomBackground(result);
    };
    checkBackground();
  }, []);

  const flatListRef = useRef<FlatList>(null);

  // 周数切换，注意改变选中周必须使用该函数，以避免 FlatList 滚动越界导致崩溃
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
          safeSetSelectedWeek(firstViewableWeek, false);
        }
      }
    },
    [safeSetSelectedWeek, selectedWeek],
  );

  // 生成周数选择器的数据
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
            // 如果是当前学期，点击快捷跳转到当前周
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

  // 提供固定的布局信息，有助于性能优化
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: width, // 每个项的宽度
      offset: width * index, // 每个项的起始位置
      index, // 当前索引
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

  // 获取 FlatList 的布局信息
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
    <>
      {/* 顶部 Tab 导航栏 */}
      <Tabs.Screen
        options={{
          headerBackground: headerBackground,
          headerLeft: headerLeft,
          headerTitle: headerTitle,
          headerRight: headerRight,
        }}
      />

      {/* 课程表详情 */}
      <FlatList
        className="flex-1"
        ref={flatListRef} // 绑定 ref
        horizontal // 水平滚动
        pagingEnabled // 分页滚动
        data={weekArray} // 数据源
        initialNumToRender={1} // 初始渲染数量，影响首屏速度
        windowSize={3} // 窗口大小
        getItemLayout={getItemLayout}
        initialScrollIndex={selectedWeek - 1} // 初始滚动位置
        renderItem={renderItem}
        onLayout={onLayout}
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
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </>
  );
};

export default memo(CoursePage);
