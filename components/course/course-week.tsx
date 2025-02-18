import DayItem from '@/components/course/day-item';
import HeaderContainer from '@/components/course/header-container';
import { Text } from '@/components/ui/text';
import type { ParsedCourse } from '@/utils/course';
import { memo, useMemo } from 'react';
import { ScrollView, View, type LayoutRectangle } from 'react-native';
import CalendarCol from './calendar-col';
import TimeCol from './time-col';

interface CourseWeekProps {
  week: number;
  startDate: string;
  schedules: ParsedCourse[];
  courseColorMap: Record<string, string>;
  showNonCurrentWeekCourses: boolean;
  flatListLayout: LayoutRectangle;
}

const CourseWeek: React.FC<CourseWeekProps> = ({
  week,
  startDate,
  schedules,
  courseColorMap,
  showNonCurrentWeekCourses,
  flatListLayout,
}) => {
  const DAYS = ['一', '二', '三', '四', '五', '六', '日'];
  const month = useMemo(() => new Date(startDate).getMonth() + 1, [startDate]);
  const headerDays = useMemo(() => {
    const today = new Date();
    today.setHours(today.getHours() + 8);
    return Array.from({ length: 7 }, (_, i) => {
      const newDate = new Date(startDate);
      newDate.setDate(newDate.getDate() + i);
      const isToday = newDate.toISOString().split('T')[0] === today.toISOString().split('T')[0];
      return {
        key: newDate.toISOString(),
        day: DAYS[i],
        date: newDate.getDate(),
        isToday,
        isWeekend: i >= 5,
      };
    });
  }, [startDate]);

  return (
    <ScrollView className="flex-1">
      <HeaderContainer>
        <View className="w-[32px] flex-shrink-0 flex-grow-0">
          <View className="flex flex-shrink-0 flex-col items-center justify-center px-2 py-3">
            <Text>{month}</Text>
            <Text>月</Text>
          </View>
        </View>
        <View className="mt-2 flex flex-shrink flex-grow flex-row">
          {headerDays.map(item => (
            <DayItem
              key={item.key}
              day={item.day}
              date={item.date}
              variant={item.isToday ? 'highlight' : item.isWeekend ? 'muted' : 'default'}
            />
          ))}
        </View>
      </HeaderContainer>

      <View className="flex flex-row">
        <TimeCol />
        <View className="flex flex-1 flex-row">
          {Array.from({ length: 7 }, (_, i) => (
            <CalendarCol
              key={`${startDate}_${i}`}
              week={week}
              weekday={i + 1}
              schedules={schedules}
              courseColorMap={courseColorMap}
              isShowNonCurrentWeekCourses={showNonCurrentWeekCourses}
              flatListLayout={{ ...flatListLayout, width: flatListLayout.width - 32 }}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default memo(CourseWeek);
