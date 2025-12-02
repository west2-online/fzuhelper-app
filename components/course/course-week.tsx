import dayjs from 'dayjs';
import { memo, useEffect, useMemo, useState } from 'react';
import { View, type LayoutRectangle } from 'react-native';

import DayItem from '@/components/course/day-item';
import HeaderContainer from '@/components/course/header-container';
import { Text } from '@/components/ui/text';

import { LEFT_TIME_COLUMN_WIDTH, TOP_CALENDAR_HEIGHT, type CourseInfo } from '@/lib/course';

import { DATE_FORMAT_FULL } from '@/lib/constants';
import { ScrollView } from 'react-native-gesture-handler';
import CalendarCol from './calendar-col';
import TimeCol from './time-col';

interface CourseWeekProps {
  week: number; // 当前周数
  startDate: string; // 当前周的开始日期
  schedulesByDays: Record<number, CourseInfo[]>; // 当天课程数据
  flatListLayout: LayoutRectangle;
}

const DAYS = ['一', '二', '三', '四', '五', '六', '日'];

// 一周课表
const CourseWeek: React.FC<CourseWeekProps> = ({ week, startDate, schedulesByDays, flatListLayout }) => {
  const month = useMemo(() => dayjs(startDate).month() + 1, [startDate]);
  const [currentDate, setCurrentDate] = useState(dayjs().format(DATE_FORMAT_FULL)); // 当前日期

  useEffect(() => {
    // TODO: 需要做一个优化，由于这个 course-week 组件是嵌套在 FlatList 中的，因此刷新时候会同时刷新多个 course-week 组件
    // 我们期望的应该是只刷新正在呈现的 course-week 组件，但是从性能角度出发，不会有很大影响
    const interval = setInterval(() => {
      setCurrentDate(dayjs().format(DATE_FORMAT_FULL));
    }, 1000 * 60); // 每分钟更新一次

    return () => clearInterval(interval); // 组件卸载时清除定时器
  }, []);

  // 头部日期
  const headerDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const newDate = dayjs(startDate).add(i, 'day');
      const isToday = newDate.isSame(currentDate, 'day');
      return {
        key: newDate.toISOString(),
        day: DAYS[i],
        date: newDate.date(),
        isToday,
        isWeekend: i >= 5,
      };
    });
  }, [startDate, currentDate]);

  return (
    <View className="flex flex-col" style={{ width: flatListLayout.width }}>
      <HeaderContainer style={{ width: flatListLayout.width, height: TOP_CALENDAR_HEIGHT }}>
        {/* （左侧）月份 */}
        <View className="flex-shrink-0 flex-grow-0" style={{ width: LEFT_TIME_COLUMN_WIDTH }}>
          <View className="flex flex-shrink-0 flex-col items-center justify-center px-2 py-3">
            <Text>{month}</Text>
            <Text>月</Text>
          </View>
        </View>

        {/* 日期 */}
        <View className="mt-2 flex flex-row" style={{ width: flatListLayout.width - LEFT_TIME_COLUMN_WIDTH }}>
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
      {/* FlatList 布局还未确定，此时渲染会导致高度的跳变
          触发次数 = initialNumToRender */}
      {flatListLayout.height > 0 && (
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex flex-row"
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces={false}
        >
          {/* （左侧）时间列 */}
          <TimeCol height={flatListLayout.height - TOP_CALENDAR_HEIGHT} />

          {/* 课程内容 */}
          <View className="flex flex-1 flex-row">
            {Array.from({ length: 7 }, (_, i) => (
              <CalendarCol
                key={`${startDate}_${i}`}
                week={week}
                schedulesOnDay={schedulesByDays[i] || []}
                flatListLayout={{
                  ...flatListLayout,
                  width: flatListLayout.width - LEFT_TIME_COLUMN_WIDTH,
                  height: flatListLayout.height - TOP_CALENDAR_HEIGHT,
                }}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default memo(CourseWeek);
