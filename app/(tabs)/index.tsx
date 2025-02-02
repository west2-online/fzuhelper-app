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
      const dates = getDatesByWeek(initialData.semesterStart, week + 1);
      setCurrentDate(dates[0]);

      // 重置 translateX
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    },
    onSwipeRight: async () => {
      setWeek(prev => Math.max(prev - 1, 1));
      const initialData = await locateDate();
      const dates = getDatesByWeek(initialData.semesterStart, Math.max(week - 1, 1));
      setCurrentDate(dates[0]);

      // 重置 translateX
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    },
  });

  useEffect(() => {
    (async () => {
      const initialData = await locateDate();
      setWeek(initialData.week); // 初始化当前周数

      // 使用 getDatesByWeek 获取当前周的日期范围
      const dates = getDatesByWeek(initialData.semesterStart, initialData.week);
      setCurrentDate(dates[0]); // 初始化为当前周的第一天（周一）
    })();
  }, []);

  const { data, isLoading } = usePersistedQuery({
    queryKey: ['getApiV1JwchCourseList', term],
    queryFn: () => getApiV1JwchCourseList({ term }),
  });

  if (!data) return null;

  const schedules = parseCourses(data.data.data);

  // semesterStart 是学期开始日期，currentWeek 是当前周数
  // e.g. semesterStart = '2024-03-04', currentWeek = 10
  const getDatesByWeek = (semesterStart: string, currentWeek: number): string[] => {
    const startDate = new Date(semesterStart);
    const startDayOfWeek = (startDate.getDay() + 6) % 7; // 将星期日（0）转换为 6，其他天数减 1 对应星期一到星期六
    const adjustedStartDate = new Date(startDate);

    // 如果学期开始日期不是星期一，则调整到最近的星期一
    adjustedStartDate.setDate(startDate.getDate() - startDayOfWeek);

    const firstDayOfWeek = new Date(adjustedStartDate);
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (currentWeek - 1) * 7);

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
            {Array.from({ length: 7 }).map((_, index) => {
              const date = new Date(currentDate);
              date.setDate(date.getDate() + index); // 计算每一天的日期

              // 获取东八区当前日期
              const today = new Date();
              today.setHours(today.getHours() + 8); // 调整为东八区时间

              // 判断是否为今天（东八区时间）
              const isValidDate = (d: Date) => !isNaN(d.getTime()); // 检查日期是否有效

              const isToday =
                isValidDate(date) &&
                isValidDate(today) &&
                date.toISOString().split('T')[0] === today.toISOString().split('T')[0];

              return (
                <DayItem
                  key={index}
                  day={['一', '二', '三', '四', '五', '六', '日'][index]}
                  date={date.getDate()}
                  isSelected={isToday} // 动态设置高亮
                  isMuted={index >= 5} // 周六、周日设置为灰色
                />
              );
            })}
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
