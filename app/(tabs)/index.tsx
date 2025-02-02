import { Link, Tabs, router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import CalendarCol from '@/components/course/CalendarCol';
import DayItem from '@/components/course/DayItem';
import DaysRow from '@/components/course/DaysRow';
import HeaderContainer from '@/components/course/HeaderContainer';
import MonthDisplay from '@/components/course/MonthDisplay';
import TimeColumn from '@/components/course/TimeColumn';
import { Text } from '@/components/ui/text';
import { JWCH_COOKIES_KEY, JWCH_ID_KEY } from '@/lib/constants';

import { getApiV1JwchCourseList } from '@/api/generate';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { parseCourses } from '@/utils/parseCourses';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from 'sonner-native';

export default function HomePage() {
  const term = '202402';
  const week = 10;
  const { data, isLoading } = usePersistedQuery({
    queryKey: ['getApiV1JwchCourseList', term],
    queryFn: () => getApiV1JwchCourseList({ term }),
  });

  if (!data) return null;

  const schedules = parseCourses(data.data.data);

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
        className="flex h-full flex-auto flex-col overflow-auto bg-white"
        stickyHeaderIndices={[0]}
        overScrollMode="never"
        bounces={false}
      >
        <HeaderContainer>
          {/* 月份显示 */}
          <MonthDisplay month={10} />

          {/* 日期行 */}
          <DaysRow>
            <DayItem day="一" date={10} isSelected />
            <DayItem day="二" date={11} />
            <DayItem day="三" date={12} />
            <DayItem day="四" date={13} />
            <DayItem day="五" date={14} />
            <DayItem day="六" date={15} isMuted />
            <DayItem day="日" date={16} isMuted />
          </DaysRow>
        </HeaderContainer>

        {/* 课程表主体 */}
        <View className="flex flex-none flex-grow flex-row py-1">
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
        </View>
      </ScrollView>
    </>
  );
}
