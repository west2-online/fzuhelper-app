import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import type { ParsedCourse } from '@/utils/course';
import { nonCurrentWeekCourses } from '@/utils/random-color';

import EmptySlot from './empty-slot';
import ScheduleItem from './schedule-item';

const MIN_HEIGHT = 49 * 11;

type ScheduleItemData =
  | {
      type: 'course';
      schedule: ParsedCourse;
      span: number;
      color: string; // 课程的颜色
    }
  | {
      type: 'empty';
    };

interface CalendarColProps {
  week: number;
  weekday: number;
  schedules: ParsedCourse[];
  isShowNonCurrentWeekCourses: boolean; // 是否显示非本周课程
  courseColorMap: Record<string, string>; // 课程颜色映射
  onSyllabusPress: (syllabus: string) => void; // 教学大纲点击事件
  onLessonPlanPress: (lessonPlan: string) => void; // 授课计划点击事件
}

// 课程表的一列，即一天的课程
const CalendarCol: React.FC<CalendarColProps> = ({
  week,
  weekday,
  schedules,
  courseColorMap,
  isShowNonCurrentWeekCourses,
  onSyllabusPress,
  onLessonPlanPress,
}) => {
  const [height, setHeight] = useState<number>(MIN_HEIGHT);

  // 根据当前周数和星期几，筛选出当天的课程
  // 并进行整合，生成一个用于渲染的数据结构
  const scheduleData = useMemo(() => {
    const schedulesOnDay = schedules.filter(schedule => schedule.weekday === weekday);
    const res: ScheduleItemData[] = [];

    for (let i = 1; i <= 11; i++) {
      // 查找当前时间段是否有课程，对于第二个参数，如果 isShowNonCurrentWeekCourses 为 true，则不限制周数
      const schedule = schedulesOnDay.find(
        s => s.startClass === i && (isShowNonCurrentWeekCourses || (s.startWeek <= week && s.endWeek >= week)),
      );

      if (schedule) {
        const span = schedule.endClass - schedule.startClass + 1;
        res.push({
          type: 'course',
          schedule,
          span,
          color:
            isShowNonCurrentWeekCourses && (schedule.startWeek > week || schedule.endWeek < week)
              ? nonCurrentWeekCourses // 非本周课程不显示颜色，这样展示时是一个边框
              : courseColorMap[schedule.syllabus], // 从课程颜色映射中获取颜色
        });
        i += span - 1;
      } else {
        res.push({ type: 'empty' });
      }
    }

    return res;
  }, [schedules, weekday, week, courseColorMap, isShowNonCurrentWeekCourses]);

  return (
    <View
      className="flex w-[14.285714%] flex-shrink-0 flex-grow flex-col"
      onLayout={({ nativeEvent }) => {
        setHeight(Math.max(MIN_HEIGHT, nativeEvent.layout.height));
      }}
    >
      {scheduleData.map((item, index) =>
        item.type === 'course' ? (
          <ScheduleItem
            key={index}
            height={height}
            span={item.span}
            color={item.color}
            schedule={item.schedule}
            onSyllabusPress={onSyllabusPress}
            onLessonPlanPress={onLessonPlanPress}
          />
        ) : (
          <EmptySlot key={index} />
        ),
      )}
    </View>
  );
};

export default CalendarCol;
