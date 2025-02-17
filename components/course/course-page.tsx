import { AntDesign } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  View,
  useWindowDimensions,
  type LayoutRectangle,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import DayItem from '@/components/course/day-item';
import HeaderContainer from '@/components/course/header-container';
import WeekSelector from '@/components/course/week-selector';
import { Text } from '@/components/ui/text';

import type { TermsListResponse_Terms } from '@/api/backend';
import { getApiV1JwchCourseList } from '@/api/generate';
import type { CourseSetting, LocateDateResult } from '@/api/interface';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { COURSE_DATA_KEY } from '@/lib/constants';
import { getDatesByWeek, getFirstDateByWeek, getWeeksBySemester, parseCourses } from '@/utils/course';
import generateRandomColor, { clearColorMapping } from '@/utils/random-color';

import CourseWeek from './course-week';

const DAYS = ['一', '二', '三', '四', '五', '六', '日'] as const;

interface CoursePageProps {
  config: CourseSetting;
  locateDateResult: LocateDateResult;
  semesterList: TermsListResponse_Terms;
}

const CoursePage: React.FC<CoursePageProps> = ({ config, locateDateResult, semesterList }) => {
  const [week, setWeek] = useState(1); // 当前周数
  const [date, setDate] = useState('2025-01-01'); // 当前日期
  const [showWeekSelector, setShowWeekSelector] = useState(false);
  const { width } = useWindowDimensions();
  const [flatListLayout, setFlatListLayout] = useState<LayoutRectangle>({ width, height: 0, x: 0, y: 0 });

  const month = useMemo(() => new Date(date).getMonth() + 1, [date]);

  // 从设置中读取相关信息，设置项由上级组件传入
  const { selectedSemester: term, showNonCurrentWeekCourses } = config;

  // 【查询课程数据】
  // 使用含缓存处理的查询 hooks，这样当网络请求失败时，会返回缓存数据
  // 注：此时访问的是 west2-online 的服务器，而不是教务系统的服务器
  const { data } = usePersistedQuery({
    queryKey: [COURSE_DATA_KEY, term],
    queryFn: () => getApiV1JwchCourseList({ term }),
  });

  const semesterListMap = useMemo(
    () => Object.fromEntries(semesterList.map(semester => [semester.term, semester])),
    [semesterList],
  );
  const currentSemester = useMemo(() => semesterListMap[term], [semesterListMap, term]);

  useEffect(() => {
    setWeek(term === locateDateResult.semester ? locateDateResult.week : 1);
    setDate(term === locateDateResult.semester ? locateDateResult.date : semesterListMap[term].start_date);
  }, [term, locateDateResult, semesterListMap]);

  const maxWeek = useMemo(
    () => getWeeksBySemester(currentSemester.start_date, currentSemester.end_date),
    [currentSemester],
  );
  const weekArray = useMemo(
    () =>
      Array.from({ length: maxWeek }, (_, i) => ({
        week: i + 1,
        firstDate: getFirstDateByWeek(currentSemester.start_date, i + 1),
      })),
    [maxWeek, currentSemester],
  );

  // 通过这里可以看到，schedules 表示的是全部的课程数据，而不是某一天的课程数据
  // schedules 是一个数组，每个元素是一个课程数据，包含了课程的详细信息

  // 这个 useMemo 用于将课程数据转换为适合展示的格式，在这里我们会先清空显示颜色的索引
  const schedules = useMemo(() => {
    return data ? parseCourses(data.data.data) : [];
  }, [data]);

  // 用于存储课程名称和颜色的对应关系，这里我们移入到 useMemo 中，避免每次渲染都重新生成
  const courseColorMap = useMemo(() => {
    clearColorMapping(); // 先清空先前的颜色映射

    const map: Record<string, string> = {};

    schedules.forEach(schedule => {
      if (!map[schedule.syllabus]) {
        map[schedule.syllabus] = generateRandomColor(schedule.name); // 基于课程名称生成颜色
      }
    });
    return map;
  }, [schedules]);

  const daysRowData = useMemo(() => {
    const today = new Date();
    today.setHours(today.getHours() + 8);

    const isValidDate = (d: Date) => !isNaN(d.getTime()); // 检查日期是否有效

    return Array.from({ length: 7 }, (_, i) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + i);

      const isToday =
        isValidDate(newDate) &&
        isValidDate(today) &&
        newDate.toISOString().split('T')[0] === today.toISOString().split('T')[0];

      return {
        key: newDate.toISOString(),
        day: DAYS[i],
        date: newDate.getDate(),
        isToday,
        isWeekend: i >= 5, // i 从 0 开始，5 和 6 分别对应周六和周日
      };
    });
  }, [date]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const newWeek = Math.round(contentOffsetX / flatListLayout.width) + 1;

      console.log('newWeek', newWeek);

      if (newWeek !== week) {
        setWeek(newWeek);
        setDate(weekArray[newWeek - 1].firstDate);
      }
    },
    [flatListLayout.width, week, weekArray],
  );

  return (
    <>
      <Tabs.Screen
        options={{
          headerTitleAlign: 'center',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerLeft: () => <Text className="ml-4 text-2xl font-medium">课程表</Text>,
          // eslint-disable-next-line react/no-unstable-nested-components
          headerTitle: () => (
            <Pressable onPress={() => setShowWeekSelector(!showWeekSelector)} className="flex flex-row items-center">
              <Text className="mr-1 text-lg">第 {week} 周 </Text>
              <AntDesign name={showWeekSelector ? 'caretup' : 'caretdown'} size={10} color="black" />
            </Pressable>
          ),
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <Link href="/course/course-settings" asChild>
              <AntDesign name="setting" size={24} color="black" className="mr-4" />
            </Link>
          ),
        }}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={showWeekSelector}
        onRequestClose={() => {
          setShowWeekSelector(!showWeekSelector);
        }}
      >
        <Pressable
          className="flex-1"
          onPress={() => setShowWeekSelector(false)} // 点击外部关闭 Modal
        >
          <View className="flex flex-1 items-center justify-center bg-[#00000050]">
            <View className="max-h-[60%] w-4/5 rounded-lg bg-card p-6">
              <WeekSelector
                currentWeek={week}
                maxWeek={maxWeek}
                onWeekSelect={selectedWeek => {
                  setWeek(selectedWeek);
                  const newDates = getDatesByWeek(semesterListMap[term].start_date, selectedWeek);
                  setDate(newDates[0]); // 假设 newDates[0] 是周一的日期
                  setShowWeekSelector(false); // 关闭 Modal
                }}
              />
            </View>
          </View>
        </Pressable>
      </Modal>

      <HeaderContainer>
        <View className="w-[32px] flex-shrink-0 flex-grow-0">
          <View className="flex flex-shrink-0 flex-col items-center justify-center px-2 py-3">
            <Text>{month}</Text>
            <Text>月</Text>
          </View>
        </View>

        <View className="mt-2 flex flex-shrink flex-grow flex-row">
          {daysRowData.map(item => (
            <DayItem
              key={item.key}
              day={item.day}
              date={item.date}
              variant={item.isToday ? 'highlight' : item.isWeekend ? 'muted' : 'default'}
            />
          ))}
        </View>
      </HeaderContainer>

      <FlatList
        horizontal
        pagingEnabled
        data={weekArray}
        keyExtractor={item => item.week.toString()}
        initialNumToRender={1}
        windowSize={3}
        renderItem={({ item }) => (
          <CourseWeek
            key={item.week}
            week={item.week}
            startDate={date}
            schedules={schedules}
            courseColorMap={courseColorMap}
            showNonCurrentWeekCourses={showNonCurrentWeekCourses}
            flatListLayout={flatListLayout}
          />
        )}
        onLayout={({ nativeEvent }) => setFlatListLayout(nativeEvent.layout)}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        showsHorizontalScrollIndicator={false}
      />
    </>
  );
};

export default CoursePage;
