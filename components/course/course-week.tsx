import DayItem from '@/components/course/day-item';
import HeaderContainer from '@/components/course/header-container';
import { Text } from '@/components/ui/text';
import type { ExtendCourse } from '@/lib/course';
import { memo, useMemo } from 'react';
import { ScrollView, View, type LayoutRectangle } from 'react-native';
import CalendarCol from './calendar-col';
import TimeCol from './time-col';

interface CourseWeekProps {
  week: number;
  startDate: string;
  schedulesByDays: Record<number, ExtendCourse[]>;
  showNonCurrentWeekCourses: boolean;
  showExam: boolean;
  flatListLayout: LayoutRectangle;
}

const DAYS = ['一', '二', '三', '四', '五', '六', '日'];

const CourseWeek: React.FC<CourseWeekProps> = ({
  week,
  startDate,
  schedulesByDays,
  showNonCurrentWeekCourses,
  showExam,
  flatListLayout,
}) => {
  const month = useMemo(() => new Date(startDate).getMonth() + 1, [startDate]);
  // 头部日期
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
    <View className="flex flex-col" style={{ width: flatListLayout.width }}>
      <HeaderContainer>
        {/* （左侧）月份 */}
        <View className="w-[32px] flex-shrink-0 flex-grow-0">
          <View className="flex flex-shrink-0 flex-col items-center justify-center px-2 py-3">
            <Text>{month}</Text>
            <Text>月</Text>
          </View>
        </View>

        {/* 日期 */}
        <View className="mt-2 flex h-[64px] flex-row" style={{ width: flatListLayout.width - 32 }}>
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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} overScrollMode="never">
        <View className="flex flex-row">
          {/* （左侧）时间列 */}
          <TimeCol />

          {/* 课程内容 */}
          <View className="flex flex-1 flex-row bg-background">
            {Array.from({ length: 7 }, (_, i) => (
              <CalendarCol
                key={`${startDate}_${i}`}
                week={week}
                showExam={showExam}
                schedulesOnDay={schedulesByDays[i] || []}
                isShowNonCurrentWeekCourses={showNonCurrentWeekCourses}
                flatListLayout={{
                  ...flatListLayout,
                  width: flatListLayout.width - 32, // 32px - 时间列宽度
                  height: flatListLayout.height - 64, // 64px - 日期头部高度
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default memo(CourseWeek);
