import { memo, useMemo } from 'react';
import { type LayoutRectangle, View } from 'react-native';

import EmptyScheduleItem from './empty-schedule-item';
import ScheduleItem from './schedule-item';

import { useCoursePageSetting } from '@/context/course-page';
import {
  COURSE_TYPE,
  COURSE_WITHOUT_ATTENDANCE,
  type CourseInfo,
  type CourseInfoMerged,
  CUSTOM_TYPE,
  EXAM_TYPE,
  SCHEDULE_ITEM_MIN_HEIGHT,
} from '@/lib/course';
import { nonCurrentWeekCourseColor } from '@/utils/random-color';

interface CourseScheduleItemDataBase {
  schedules: CourseInfoMerged[];
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

    // 合并所有课程
    const mergeMap = new Map<string, CourseInfoMerged>();

    schedulesOnDay.forEach(course => {
      const cleanName = course.name.replace(/^\[调课\]\s*/, '');
      const key = `${course.weekday}-${cleanName}-${course.startClass}-${course.endClass}-${course.location}`;

      const currentWeekSegment = {
        startWeek: course.startWeek,
        endWeek: course.endWeek,
        isAdjusted: course.name.startsWith('[调课]'),
        single: course.single,
        double: course.double,
      };
      const lesson = mergeMap.get(key);
      if (!lesson) {
        mergeMap.set(key, {
          ...course,
          name: cleanName,
          weekSegments: [currentWeekSegment],
          weekDisplay: '', // 先占位，后面根据 weekSegments 生成显示文本
        });
      } else {
        lesson.weekSegments.push(currentWeekSegment);
      }
    });

    const mergedSchedules = Array.from(mergeMap.values()).map(course => {
      const sorted = [...course.weekSegments].sort((a, b) => a.startWeek - b.startWeek);
      const merged = [{ ...sorted[0] }];

      // 合并相邻的周段
      for (let i = 1; i < sorted.length; i++) {
        const last = merged[merged.length - 1];
        const curr = sorted[i];
        if (curr.startWeek <= last.endWeek + 1) {
          last.endWeek = Math.max(last.endWeek, curr.endWeek);
        } else {
          merged.push({ ...curr });
        }
      }
      // 根据合并后的周段重新计算单双周
      let hasSingle = false;
      let hasDouble = false;
      merged.forEach(seg => {
        for (let w = seg.startWeek; w <= seg.endWeek; w++) {
          if (w % 2 === 1 && seg.single !== false) hasSingle = true;
          if (w % 2 === 0 && seg.double !== false) hasDouble = true;
        }
      });
      const totalSpan = merged.reduce((sum, seg) => sum + (seg.endWeek - seg.startWeek + 1), 0);

      // 如果总周数 <= 2，视为正常课程（不限制单双周）
      if (totalSpan <= 2) {
        course.single = true;
        course.double = true;
      } else {
        course.single = hasSingle;
        course.double = hasDouble;
      }

      // 生成周数显示文本
      course.weekDisplay =
        merged
          .map(w => {
            const weekStr = w.startWeek === w.endWeek ? `${w.startWeek}` : `${w.startWeek}-${w.endWeek}`;
            return weekStr;
          })
          .join(', ') + '周';

      return course;
    });

    // 先按优先级排本周的课和考试，重叠的不管
    const today = mergedSchedules
      .filter(
        s =>
          s.weekSegments.some(
            seg =>
              seg.startWeek <= week &&
              week <= seg.endWeek &&
              ((seg.single && week % 2 === 1) || (seg.double && week % 2 === 0)),
          ) && // 检查是否在本周有课（含单双周）
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
      const nonCurrentWeek = mergedSchedules
        .filter(
          s =>
            !s.weekSegments.some(
              seg =>
                seg.startWeek <= week &&
                week <= seg.endWeek &&
                ((seg.single && week % 2 === 1) || (seg.double && week % 2 === 0)),
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
            week={week}
          />
        ) : (
          <EmptyScheduleItem key={index} itemHeight={itemHeight} />
        ),
      )}
    </View>
  );
};

export default memo(CalendarCol);
