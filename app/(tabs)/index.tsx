import { Link, Tabs, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, View } from 'react-native';

import CalendarCol from '@/components/course/CalendarCol';
import DayItem from '@/components/course/DayItem';
import DaysRow from '@/components/course/DaysRow';
import HeaderContainer from '@/components/course/HeaderContainer';
import MonthDisplay from '@/components/course/MonthDisplay';
import TimeColumn from '@/components/course/TimeColumn';
import { Text } from '@/components/ui/text';

import { getApiV1JwchCourseList } from '@/api/generate';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { JWCH_COOKIES_KEY, JWCH_ID_KEY } from '@/lib/constants';
import { createGestureHandler } from '@/lib/gesture-handler'; // 引入滑动手势处理器
import locateDate from '@/utils/locate-date';
import { parseCourses } from '@/utils/parseCourses';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from 'sonner-native';

export default function HomePage() {
  const term = '202402';
  const [week, setWeek] = useState(10); // 当前周数
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal'); // 滑动方向，默认为水平
  const [currentDate, setCurrentDate] = useState<string>(''); // 当前日期

  // 基于滑动手势处理器，创建手势处理对象的回调逻辑，用于 ScrollView 组件的滑动事件处理
  const { panResponder, translateX, translateY } = createGestureHandler({
    direction,
    onSwipeLeft: async () => {
      setWeek(prev => prev + 1);
      const initialData = await locateDate();
      const dates = getDatesByWeek(initialData.semesterStart, week + 1); // 计算下一周的日期
      setCurrentDate(dates[0]); // 更新当前日期为下一周的第一天
    },
    onSwipeRight: async () => {
      setWeek(prev => Math.max(prev - 1, 1));
      const initialData = await locateDate();
      const dates = getDatesByWeek(initialData.semesterStart, Math.max(week - 1, 1)); // 计算上一周的日期
      setCurrentDate(dates[0]); // 更新当前日期为上一周的第一天
    },
    onSwipeUp: async () => {
      setWeek(prev => prev + 1);
      const initialData = await locateDate();
      const dates = getDatesByWeek(initialData.semesterStart, week + 1);
      setCurrentDate(dates[0]);
    },
    onSwipeDown: async () => {
      setWeek(prev => Math.max(prev - 1, 1));
      const initialData = await locateDate();
      const dates = getDatesByWeek(initialData.semesterStart, Math.max(week - 1, 1));
      setCurrentDate(dates[0]);
    },
  });

  useEffect(() => {
    (async () => {
      const initialData = await locateDate();
      setCurrentDate(initialData.date); // 初始化当前日期
      setWeek(initialData.week); // 初始化当前周数
    })();
  }, []);

  const { data, isLoading } = usePersistedQuery({
    queryKey: ['getApiV1JwchCourseList', term],
    queryFn: () => getApiV1JwchCourseList({ term }),
  });

  if (!data) return null;

  const schedules = parseCourses(data.data.data);

  const getDatesByWeek = (semesterStart: string, currentWeek: number): string[] => {
    const startDate = new Date(semesterStart);
    const firstDayOfWeek = new Date(startDate.setDate(startDate.getDate() + (currentWeek - 1) * 7));
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      return date.toISOString().split('T')[0]; // 返回日期字符串格式 YYYY-MM-DD
    });
  };

  // 教学大纲点击事件，这个入参会在点击时由 ScheduleItem 提供
  const onSyllabusPress = async (syllabus: string) => {
    router.push({
      pathname: '/(guest)/web',
      params: {
        url: `${syllabus}&id=${await AsyncStorage.getItem(JWCH_ID_KEY)}`,
        jwchCookie: await AsyncStorage.getItem(JWCH_COOKIES_KEY),
      },
    });
  };

  // 授课计划点击事件，这个入参会在点击时由 ScheduleItem 提供
  const onLessonPlanPress = async (lessonPlan: string) => {
    router.push({
      pathname: '/(guest)/web',
      params: {
        url: `${lessonPlan}&id=${await AsyncStorage.getItem(JWCH_ID_KEY)}`,
        jwchCookie: await AsyncStorage.getItem(JWCH_COOKIES_KEY),
      },
    });
  };

  return (
    <>
      {/* 顶部导航栏配置 */}
      <Tabs.Screen
        options={{
          headerTitleAlign: 'center',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerLeft: () => <Text className="ml-4 text-2xl font-medium">课程表</Text>,
          // eslint-disable-next-line react/no-unstable-nested-components
          headerTitle: () => (
            <Pressable onPress={() => toast.info('周数切换')} className="flex flex-row items-center">
              <Text className="mr-1 text-lg">第 {week} 周 </Text>
              <AntDesign name="caretdown" size={10} color="black" />
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

      {/* 主体内容 */}
      <ScrollView
        {...panResponder.panHandlers} // 绑定滑动手势
        className="flex h-full flex-auto flex-col overflow-auto bg-white"
        stickyHeaderIndices={[0]}
        overScrollMode="never"
        bounces={false}
      >
        <HeaderContainer>
          {/* 月份显示 */}
          <MonthDisplay month={new Date(currentDate).getMonth() + 1} />

          {/* 日期行 */}
          <DaysRow>
            <DayItem day="一" date={new Date(currentDate).getDate()} isSelected />
            <DayItem day="二" date={new Date(currentDate).getDate() + 1} />
            <DayItem day="三" date={new Date(currentDate).getDate() + 2} />
            <DayItem day="四" date={new Date(currentDate).getDate() + 3} />
            <DayItem day="五" date={new Date(currentDate).getDate() + 4} />
            <DayItem day="六" date={new Date(currentDate).getDate() + 5} isMuted />
            <DayItem day="日" date={new Date(currentDate).getDate() + 6} isMuted />
          </DaysRow>
        </HeaderContainer>

        {/* 课程表主体 */}
        <Animated.View
          style={{
            transform: [
              { translateX: direction === 'horizontal' ? translateX : 0 },
              { translateY: direction === 'vertical' ? translateY : 0 },
            ],
          }}
          className="flex flex-none flex-grow flex-row py-1"
        >
          {/* 时间列 */}
          <TimeColumn />

          {/* 每日课程列 */}
          <View className="flex flex-shrink flex-grow flex-row">
            {Array.from({ length: 7 }).map((_, index) => (
              <CalendarCol
                key={index}
                week={week}
                weekday={index + 1}
                schedules={schedules}
                onLessonPlanPress={onLessonPlanPress}
                onSyllabusPress={onSyllabusPress}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </>
  );
}
