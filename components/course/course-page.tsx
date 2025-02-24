import { Icon } from '@/components/Icon';
import { Tabs } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  useColorScheme,
  useWindowDimensions,
  type LayoutRectangle,
  type ViewToken,
} from 'react-native';

import Loading from '@/components/loading';
import PickerModal from '@/components/picker-modal';
import { Text } from '@/components/ui/text';
import { toast } from 'sonner-native';
import CourseWeek from './course-week';

import type { TermsListResponse_Terms } from '@/api/backend';
import { getApiV1JwchCourseList } from '@/api/generate';
import type { CourseSetting, LocateDateResult } from '@/api/interface';
import { COURSE_DATA_KEY } from '@/lib/constants';
import {
  CalDigest,
  TransferToExtendCourse,
  cachedData,
  cachedDigest,
  getFirstDateByWeek,
  getWeeksBySemester,
} from '@/lib/course';
import { fetchWithCache } from '@/utils/fetch-with-cache';

interface CoursePageProps {
  config: CourseSetting;
  locateDateResult: LocateDateResult;
  semesterList: TermsListResponse_Terms;
}

// 课程表页面
const CoursePage: React.FC<CoursePageProps> = ({ config, locateDateResult, semesterList }) => {
  const [week, setWeek] = useState(1); // 当前周数
  const [showWeekSelector, setShowWeekSelector] = useState(false);
  const { width } = useWindowDimensions(); // 获取屏幕宽度
  const [flatListLayout, setFlatListLayout] = useState<LayoutRectangle>({ width, height: 0, x: 0, y: 0 }); // FlatList 的布局信息
  const [schedulesByDays, setSchedulesByDays] = useState(cachedData || []); // 目前的课程数据，按天归类

  const colorScheme = useColorScheme();
  const flatListRef = useRef<FlatList>(null);

  // 从设置中读取相关信息（比如当前选择的学期，是否显示非本周课程），设置项由上级组件传入
  const { selectedSemester: term, showNonCurrentWeekCourses } = config;

  // 【查询课程数据】
  // 使用含缓存处理的查询 hooks，这样当网络请求失败时，会返回缓存数据
  // 注：此时访问的是 west2-online 的服务器，而不是教务系统的服务器
  useEffect(() => {
    // 拉取新数据
    const fetchData = async () => {
      try {
        const fetchedData = await fetchWithCache(
          [COURSE_DATA_KEY, term],
          () => getApiV1JwchCourseList({ term }),
          1000 * 60 * 60 * 24,
        );

        // 如果有缓存数据，且缓存数据和新数据不一致，则更新数据
        if (!cachedData || CalDigest(fetchedData.data.data) !== cachedDigest) {
          toast.info('检测到课程数据变更，已自动刷新');
          setSchedulesByDays(TransferToExtendCourse(fetchedData.data.data, colorScheme));
        }
      } catch (error: any) {
        console.error(error);
        toast.error('课程数据获取失败，请检查网络连接，将使用本地缓存');
      }
    };

    // 如果有缓存数据，优先使用缓存数据
    if (cachedData) {
      setSchedulesByDays(cachedData);
    }
    fetchData();
  }, [term, colorScheme]);

  // 以下是处理学期的数据
  // 将学期数据转换为 Map，方便后续使用
  const semesterListMap = useMemo(
    () => Object.fromEntries(semesterList.map(semester => [semester.term, semester])),
    [semesterList],
  );

  // 获取当前学期的开始结束时间（即从 semesterList 中取出当前学期的信息，term 表示当前选择的学期）
  const currentSemester = useMemo(() => semesterListMap[term], [semesterListMap, term]);

  // 确认当前周，如果是历史学期（即和 locateDateResult 给出的学期不符），则默认回退到第一周
  useEffect(() => {
    setWeek(term === locateDateResult.semester ? locateDateResult.week : 1);
  }, [term, locateDateResult, semesterListMap]);

  // 获取当前学期的最大周数
  const maxWeek = useMemo(
    () => getWeeksBySemester(currentSemester.start_date, currentSemester.end_date),
    [currentSemester],
  );

  // 生成一周的日期数据
  const weekArray = useMemo(
    () =>
      Array.from({ length: maxWeek }, (_, i) => ({
        week: i + 1,
        firstDate: getFirstDateByWeek(currentSemester.start_date, i + 1),
      })),
    [maxWeek, currentSemester],
  );

  // 通过 viewability 回调获取当前周
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<(typeof weekArray)[0]>[] }) => {
      if (viewableItems.length > 0) {
        setWeek(viewableItems[0].item.week);
      }
    },
    [],
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

  return (
    <>
      {/* 顶部 Tab 导航栏 */}
      <Tabs.Screen
        options={{
          headerTitleAlign: 'center',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerLeft: () => <Text className="ml-4 text-2xl font-medium">课程表</Text>,
          // eslint-disable-next-line react/no-unstable-nested-components
          headerTitle: () => (
            <Pressable onPress={() => setShowWeekSelector(!showWeekSelector)} className="flex flex-row items-center">
              <Text className="mr-1 text-lg">第 {week} 周 </Text>
              <Icon name={showWeekSelector ? 'caret-up-outline' : 'caret-down-outline'} size={10} />
            </Pressable>
          ),
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => <Icon href="/settings/course" name="settings-outline" size={24} className="mr-4" />,
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
        // 渲染列表项（此处一项为一屏的内容）
        renderItem={({ item }) => (
          <CourseWeek
            key={item.week}
            week={item.week}
            startDate={item.firstDate}
            schedulesByDays={schedulesByDays}
            showNonCurrentWeekCourses={showNonCurrentWeekCourses}
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
        value={String(week)}
        onClose={() => setShowWeekSelector(false)}
        onConfirm={selectedValue => {
          setShowWeekSelector(false);
          const selectedWeek = parseInt(selectedValue, 10);
          setWeek(selectedWeek);
          flatListRef.current?.scrollToIndex({
            index: selectedWeek - 1,
            animated: false,
          });
        }}
      />
    </>
  );
};

export default CoursePage;
