import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions, type LayoutRectangle, type ViewToken } from 'react-native';
import { toast } from 'sonner-native';

import { Icon } from '@/components/Icon';
import Loading from '@/components/loading';
import PickerModal from '@/components/picker-modal';
import { Text } from '@/components/ui/text';

import type { TermsListResponse_Terms } from '@/types/backend';
import { getApiV1JwchClassroomExam, getApiV1JwchCourseList } from '@/api/generate';
import type { CourseSetting } from '@/types/interface';
import { COURSE_DATA_KEY, EXAM_ROOM_KEY, EXPIRE_ONE_DAY } from '@/types/constants';
import { COURSE_TYPE, CourseCache, EXAM_TYPE, type CourseInfo } from '@/lib/course';
import { formatExamData } from '@/lib/exam-room';
import { deConvertSemester, getFirstDateByWeek, getWeeksBySemester } from '@/lib/locate-date';
import { LocalUser, USER_TYPE_POSTGRADUATE } from '@/lib/user';
import { fetchWithCache } from '@/utils/fetch-with-cache';

import { hasCustomBackground } from '@/lib/appearance';
import CourseWeek from './course-week';

interface CoursePageProps {
  config: CourseSetting;
  initialWeek: number;
  semesterList: TermsListResponse_Terms;
  currentTerm: string;
}

// 课程表页面
const CoursePage: React.FC<CoursePageProps> = ({ config, initialWeek, semesterList, currentTerm }) => {
  const [currentWeek, setCurrentWeek] = useState(initialWeek); // 当前周数
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

  // 从设置中读取相关信息（比如当前选择的学期，是否显示非本周课程），设置项由上级组件传入
  const {
    selectedSemester: term,
    showNonCurrentWeekCourses,
    exportExamToCourseTable,
    hiddenCoursesWithoutAttendances,
  } = config;

  // 以下是处理学期的数据
  // 将学期数据转换为 Map，方便后续使用
  const semesterListMap = useMemo(
    () => Object.fromEntries(semesterList.map(semester => [semester.term, semester])),
    [semesterList],
  );

  // 获取当前学期的开始结束时间（即从 semesterList 中取出当前学期的信息，term 表示当前选择的学期）
  // 需要注意的是，不论本科生还是研究生，term 的格式均遵循本科生数据格式，即 202401 这样的
  // 对于研究生，locate-date 需要依赖本科教务系统（即使研究生院教务系统也是这样的），所以我们只选择在查询研究生课表的时候进行一个转化即可，不在这里做转化
  // 相关转化逻辑请参考 @/lib/locate-date.ts 中相关函数
  const currentSemester = useMemo(() => semesterListMap[term], [semesterListMap, term]);

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
        let queryTerm = term;
        if (LocalUser.getUser().type === USER_TYPE_POSTGRADUATE) {
          queryTerm = deConvertSemester(term);
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
        if (exportExamToCourseTable) {
          const examData = await fetchWithCache(
            [EXAM_ROOM_KEY, queryTerm],
            () => getApiV1JwchClassroomExam({ term: queryTerm }),
            EXPIRE_ONE_DAY,
          );

          const mergedExamData = formatExamData(examData.data.data);
          if (mergedExamData.length > 0 && !CourseCache.compareDigest(EXAM_TYPE, mergedExamData)) {
            CourseCache.mergeExamCourses(mergedExamData, currentSemester.start_date, currentSemester.end_date);
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
        flatListRef.current?.scrollToIndex({
          index: initialWeek - 1,
          animated: false,
        });
        setCurrentWeek(initialWeek);
      }
      return true;
    });
  }, [term, exportExamToCourseTable, currentSemester, initialWeek]);

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

  // 通过 view ability 回调获取当前周
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<(typeof weekArray)[0]>[] }) => {
      if (viewableItems.length > 0) {
        setCurrentWeek(viewableItems[0].item.week);
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
                setCurrentWeek(initialWeek);
                flatListRef.current?.scrollToIndex({ index: initialWeek - 1, animated: false });
              }}
            >
              <Text className="ml-4 text-2xl font-medium">课程表</Text>
            </Pressable>
          ),
          // eslint-disable-next-line react/no-unstable-nested-components
          headerTitle: () => (
            <Pressable onPress={() => setShowWeekSelector(!showWeekSelector)} className="flex flex-row items-center">
              <Text className="mr-1 text-lg">
                第 {currentWeek} 周 {currentWeek === initialWeek && currentTerm === term ? '(本周)' : ''}
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
        initialScrollIndex={currentWeek - 1} // 初始滚动位置
        // 渲染列表项（此处一项为一屏的内容）
        renderItem={({ item }) => (
          <CourseWeek
            key={item.week}
            week={item.week}
            startDate={item.firstDate}
            schedulesByDays={schedulesByDays}
            showNonCurrentWeekCourses={showNonCurrentWeekCourses}
            hiddenCoursesWithoutAttendances={hiddenCoursesWithoutAttendances}
            showExam={exportExamToCourseTable}
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
        value={String(currentWeek)}
        onClose={() => setShowWeekSelector(false)}
        onConfirm={selectedValue => {
          setShowWeekSelector(false);
          const selectedWeek = parseInt(selectedValue, 10);
          setCurrentWeek(selectedWeek);
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
