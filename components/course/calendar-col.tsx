import { memo, useMemo } from 'react';
import { type LayoutRectangle, View } from 'react-native';

import EmptyScheduleItem from './empty-schedule-item';
import ScheduleItem from './schedule-item';

import { useCoursePageSetting } from '@/context/course-page';
import {
  COURSE_TYPE,
  COURSE_WITHOUT_ATTENDANCE,
  type CourseInfo,
  CUSTOM_TYPE,
  EXAM_TYPE,
  SCHEDULE_ITEM_MIN_HEIGHT,
} from '@/lib/course';
import { nonCurrentWeekCourseColor } from '@/utils/random-color';

interface CourseScheduleItemDataBase {
  schedules: CourseInfo[];
  span: number;
  color: string; // 课程的颜色
}

type CourseScheduleItemData = { type: 'course' } & CourseScheduleItemDataBase;
type EmptyScheduleItemData = { type: 'empty' };
type ScheduleItemData = CourseScheduleItemData | EmptyScheduleItemData;

interface CalendarColProps {
  week: number;
  schedulesOnDay: CourseInfo[];
  flatListLayout: LayoutRectangle;
}

// 课程表的一列，即一天的课程
const CalendarCol: React.FC<CalendarColProps> = ({ week, schedulesOnDay, flatListLayout }) => {
  const itemHeight = useMemo(
    () => Math.max(SCHEDULE_ITEM_MIN_HEIGHT, Math.floor(flatListLayout.height / 11)),
    [flatListLayout.height],
  );
  const setting = useCoursePageSetting();

  // 根据当前周数和星期几，筛选出当天的课程
  // 并进行整合，生成一个用于渲染的数据结构
  const scheduleData = useMemo(() => {
    // 主要的课程
    const mainCourses: CourseScheduleItemDataBase[] = [];

    // 先按优先级排本周的课和考试，重叠的不管
    const today = schedulesOnDay
      .filter(
        s =>
          s.startWeek <= week && // 卡起始时间范围
          s.endWeek >= week && // 卡结束时间范围
          ((s.single && week % 2 === 1) || (s.double && week % 2 === 0)) && // 检查单双周
          (s.type === COURSE_TYPE ||
            (setting.exportExamToCourseTable && s.type === EXAM_TYPE) ||
            s.type === CUSTOM_TYPE) && // 判断课程类型
          // 这边?是因为custom-course中DEFAULT_EMPTY_COURSE漏加examType字段，又因为as强转导致变为undefined，为向前兼容所加
          // 后面如果有新加字段，也建议加?处理
          (!setting.hiddenCoursesWithoutAttendances || !s.examType?.includes(COURSE_WITHOUT_ATTENDANCE)), // 是否隐藏免听课程
      )
      .sort((a, b) => b.priority - a.priority);

    const occupied = new Array(11).fill(false); // 0~10 对应 1~11 节课

    const rest = []; // 因重叠未能排放的课程

    for (const s of today) {
      // 检查是否有重叠
      let hasOverlap = false;

      for (let i = s.startClass; i <= s.endClass; i++) {
        if (occupied[i - 1]) {
          hasOverlap = true;
          rest.push(s);
          break;
        }
      }

      if (hasOverlap) continue;

      // 没有重叠，排入
      mainCourses.push({
        schedules: [s],
        span: s.endClass - s.startClass + 1,
        color: s.color,
      });

      // 标记区间内课次已被占用
      for (let i = s.startClass; i <= s.endClass; i++) {
        occupied[i - 1] = true;
      }
    }

    // 标记是否有重叠，根据已排课程的每一个时间段，检查是否有重叠课程，如有则补充进去
    for (const s of mainCourses) {
      // 在 rest 里面找到重叠的课程
      const overlap = rest.filter(
        l => l.startClass <= s.schedules[0].endClass && l.endClass >= s.schedules[0].startClass,
      );
      if (overlap.length > 0) {
        s.schedules.push(...overlap);
      }
    }

    // 再按优先级去排非本周课（不含考试等），重叠的也不管
    if (setting.showNonCurrentWeekCourses) {
      const nonCurrentWeek = schedulesOnDay
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
        mainCourses.push({
          schedules: [s],
          span: s.endClass - s.startClass + 1,
          color: nonCurrentWeekCourseColor,
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
        res.push({ type: 'empty' });
        i++;
      } else {
        const current = mainCourses.find(s => s.schedules[0].startClass === i + 1);
        if (current) {
          res.push({ type: 'course', ...current });
          i += current.span;
        } else {
          res.push({ type: 'empty' });
          i++;
        }
      }
    }

    return res;
  }, [
    schedulesOnDay,
    setting.showNonCurrentWeekCourses,
    setting.exportExamToCourseTable,
    setting.hiddenCoursesWithoutAttendances,
    week,
  ]);

  return (
    <View className="flex flex-shrink-0 flex-grow flex-col" style={{ width: flatListLayout.width / 7 }}>
      {scheduleData.map((item, index) =>
        item.type === 'course' ? (
          <ScheduleItem
            key={index}
            itemHeight={itemHeight}
            span={item.span}
            color={item.color}
            schedules={item.schedules}
          />
        ) : (
          <EmptyScheduleItem key={index} itemHeight={itemHeight} />
        ),
      )}
    </View>
  );
};

export default memo(CalendarCol);
