import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import type { ParsedCourse } from '@/utils/course';

import EmptySlot from './empty-slot';
import ScheduleItem from './schedule-item';

interface CalendarColProps {
  week: number;
  weekday: number;
  schedules: ParsedCourse[];
  onSyllabusPress: (syllabus: string) => void; // 教学大纲点击事件
  onLessonPlanPress: (lessonPlan: string) => void; // 授课计划点击事件
}

// 课程表的一列，即一天的课程
const CalendarCol: React.FC<CalendarColProps> = ({ week, weekday, schedules, onSyllabusPress, onLessonPlanPress }) => {
  const [height, setHeight] = useState<number>(49 * 11);

  // 通过 useMemo 优化，避免重复计算
  const scheduleComponents = useMemo(() => {
    const schedulesOnDay = schedules.filter(schedule => schedule.weekday === weekday);
    const res: React.ReactNode[] = [];

    for (let i = 1; i <= 11; i++) {
      const schedule = schedulesOnDay.find(s => s.startClass === i && s.startWeek <= week && s.endWeek >= week);

      if (schedule) {
        const span = schedule.endClass - schedule.startClass + 1;
        res.push(
          <ScheduleItem
            key={i}
            schedule={schedule}
            height={height}
            span={span}
            onLessonPlanPress={onLessonPlanPress}
            onSyllabusPress={onSyllabusPress}
          />,
        );
        i += span - 1;
      } else {
        res.push(<EmptySlot key={i} />);
      }
    }

    return res;
  }, [schedules, weekday, week, height, onLessonPlanPress, onSyllabusPress]);

  return (
    <View
      className="flex w-[14.285714%] flex-shrink-0 flex-grow flex-col"
      onLayout={({ nativeEvent }) => {
        setHeight(nativeEvent.layout.height);
      }}
    >
      {scheduleComponents}
    </View>
  );
};

export default CalendarCol;
