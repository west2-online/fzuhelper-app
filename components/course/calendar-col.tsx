import { memo, useMemo } from 'react';
import { View, type LayoutRectangle } from 'react-native';

import EmptyScheduleItem from './empty-schedule-item';
import ScheduleItem from './schedule-item';

import { COURSE_TYPE, EXAM_TYPE, SCHEDULE_MIN_HEIGHT, type ExtendCourse } from '@/lib/course';
import { nonCurrentWeekCourses } from '@/utils/random-color';

type CourseScheduleItemData = {
  schedules: ExtendCourse[];
  span: number;
  color: string; // 课程的颜色
};

type EmptyScheduleItemData = object;

type ScheduleItemData = CourseScheduleItemData | EmptyScheduleItemData;

interface CalendarColProps {
  week: number;
  schedulesOnDay: ExtendCourse[];
  isShowNonCurrentWeekCourses: boolean; // 是否显示非本周课程
  showExam: boolean; // 是否显示考试
  flatListLayout: LayoutRectangle;
}

// 移除重复的课程，之所以需要这个，是因为教务处会莫名其妙安排完全一样的课程在教务处的课程表中，导致大量的重复课程显示
const removeDuplicateSchedules = (schedules: ExtendCourse[]): ExtendCourse[] => {
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
  schedulesOnDay,
  isShowNonCurrentWeekCourses,
  showExam,
  flatListLayout,
}) => {
  // 根据当前周数和星期几，筛选出当天的课程
  // 并进行整合，生成一个用于渲染的数据结构
  const scheduleData = useMemo(() => {
    // 对课程进行去重
    let schedules = removeDuplicateSchedules(schedulesOnDay);

    const tempRes: CourseScheduleItemData[] = [];

    // 先按优先级排本周的课和考试，重叠的不管
    const today = schedules
      .filter(
        s =>
          s.startWeek <= week &&
          s.endWeek >= week &&
          ((s.single && week % 2 === 1) || (s.double && week % 2 === 0)) &&
          (s.type === COURSE_TYPE || (showExam && s.type === EXAM_TYPE)),
      )
      .sort((a, b) => b.priority - a.priority);

    const occupied = new Array(11).fill(false); // 0~10 对应 1~11 节课

    let left = []; // 因重叠未能排放的课程

    for (let s of today) {
      // 检查是否有重叠
      let hasOverlap = false;
      for (let i = s.startClass; i <= s.endClass; i++) {
        if (occupied[i - 1]) {
          hasOverlap = true;
          left.push(s);
          break;
        }
      }
      if (hasOverlap) continue;
      // 没有重叠，排入
      const span = s.endClass - s.startClass + 1;
      tempRes.push({
        schedules: [s],
        span,
        color: s.color,
      });
      // 标记已占用
      for (let i = s.startClass; i <= s.endClass; i++) {
        occupied[i - 1] = true;
      }
    }

    // 标记是否有重叠，根据已排课程的每一个时间段，检查是否有重叠课程，如有则补充进去
    for (let s of tempRes) {
      // 在left里面找到重叠的课程
      let overlap = left.filter(
        l => l.startClass <= s.schedules[0].endClass && l.endClass >= s.schedules[0].startClass,
      );
      if (overlap.length > 0) {
        s.schedules.push(...overlap);
      }
    }

    // 再按优先级去排非本周课（不含考试等），重叠的也不管
    if (isShowNonCurrentWeekCourses) {
      const nonCurrentWeek = schedules
        .filter(
          s =>
            !(
              s.startWeek <= week &&
              s.endWeek >= week &&
              ((s.single && week % 2 === 1) || (s.double && week % 2 === 0))
            ) && s.type === COURSE_TYPE,
        )
        .sort((a, b) => b.priority - a.priority);

      for (let s of nonCurrentWeek) {
        // 检查是否有重叠
        let hasOverlap = false;
        for (let i = s.startClass; i <= s.endClass; i++) {
          if (occupied[i - 1]) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) continue;
        // 没有重叠，排入
        const span = s.endClass - s.startClass + 1;
        tempRes.push({
          schedules: [s],
          span,
          color: nonCurrentWeekCourses,
        });
        // 标记已占用
        for (let i = s.startClass; i <= s.endClass; i++) {
          occupied[i - 1] = true;
        }
      }

      // 如果是非本周课程，暂不显示与其重叠的课程
    }

    const res: ScheduleItemData[] = [];
    // 按照顺序排列，并补充空白格
    for (let i = 0; i < 11; ) {
      if (!occupied[i]) {
        res.push({});
        i++;
      } else {
        const current = tempRes.find(s => s.schedules[0].startClass === i + 1);
        if (current) {
          res.push(current);
          i += current.span;
        }
      }
    }

    return res;
  }, [schedulesOnDay, isShowNonCurrentWeekCourses, week, showExam]);

  return (
    <View className="flex flex-shrink-0 flex-grow flex-col" style={{ width: flatListLayout.width / 7 }}>
      {scheduleData.map((item, index) =>
        'schedules' in item ? (
          <ScheduleItem
            key={index}
            height={Math.max(SCHEDULE_MIN_HEIGHT, flatListLayout.height)}
            span={item.span}
            color={item.color}
            schedules={item.schedules}
          />
        ) : (
          <EmptyScheduleItem key={index} height={Math.max(SCHEDULE_MIN_HEIGHT, flatListLayout.height)} />
        ),
      )}
    </View>
  );
};

export default memo(CalendarCol);
