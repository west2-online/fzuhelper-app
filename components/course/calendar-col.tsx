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
      overlappingSchedules?: ParsedCourse[]; // 重叠的课程
      isPartialOverlap?: boolean; // 是否是部分重叠
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

// 移除重复的课程，之所以需要这个，是因为教务处会莫名其妙安排完全一样的课程在教务处的课程表中，导致大量的重复课程显示
const removeDuplicateSchedules = (schedules: ParsedCourse[]): ParsedCourse[] => {
  const seen = new Set<string>();
  return schedules.filter(schedule => {
    // 将课程的唯一标识组合为一个字符串，例如 "课程名+教师+开始时间+结束时间+开始周数+结束周数"
    const identifier = `${schedule.name}-${schedule.teacher}-${schedule.startClass}-${schedule.endClass}-${schedule.startWeek}-${schedule.endWeek}`;
    if (seen.has(identifier)) {
      return false; // 如果已经存在，则过滤掉
    }
    seen.add(identifier); // 如果不存在，则添加到集合中
    return true;
  });
};

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
    // 筛选出当前星期几的课程
    let schedulesOnDay = schedules.filter(schedule => schedule.weekday === weekday);

    // 对课程进行去重
    schedulesOnDay = removeDuplicateSchedules(schedulesOnDay);

    const res: ScheduleItemData[] = [];

    for (let i = 1; i <= 11; i++) {
      // 找出当前时间段的所有课程
      const overlappingSchedules = schedulesOnDay.filter(
        s =>
          s.startClass <= i &&
          s.endClass >= i && // 当前时间段是否在课程时间范围内
          (isShowNonCurrentWeekCourses || (s.startWeek <= week && s.endWeek >= week)), // 是否符合周数条件
      );

      if (overlappingSchedules.length > 0) {
        const primarySchedule = overlappingSchedules[0]; // 默认取第一个课程为主课程
        const span = primarySchedule.endClass - primarySchedule.startClass + 1;

        res.push({
          type: 'course',
          schedule: primarySchedule,
          span,
          color:
            isShowNonCurrentWeekCourses && (primarySchedule.startWeek > week || primarySchedule.endWeek < week)
              ? nonCurrentWeekCourses
              : courseColorMap[primarySchedule.syllabus],
          overlappingSchedules: overlappingSchedules.length > 1 ? overlappingSchedules : undefined, // 如果有重叠课程，存储重叠课程信息
          isPartialOverlap: overlappingSchedules.some(
            s => s.startClass !== primarySchedule.startClass || s.endClass !== primarySchedule.endClass,
          ), // 是否存在部分重叠
        });

        i += span - 1; // 跳过当前课程的跨度
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
            overlappingSchedules={item.overlappingSchedules}
            isPartialOverlap={item.isPartialOverlap}
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
