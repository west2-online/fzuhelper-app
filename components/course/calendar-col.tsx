import { memo, useMemo } from 'react';
import { type LayoutRectangle, View } from 'react-native';

import EmptyScheduleItem from './empty-schedule-item';
import ScheduleItem from './schedule-item';

import { useTheme } from '@/components/app-theme-provider';
import { useCoursePageSetting } from '@/context/course-page';
import {
  COURSE_TYPE,
  COURSE_WITHOUT_ATTENDANCE,
  type CourseInfoMerged,
  CUSTOM_TYPE,
  EXAM_TYPE,
  SCHEDULE_ITEM_MIN_HEIGHT,
} from '@/lib/course';
import { isCourseScheduledInWeek } from '@/lib/course-schedule';
import { coursePalettes } from '@/lib/palettes';

interface CourseScheduleItemDataBase {
  schedules: CourseInfoMerged[];
  span: number;
  nonCurrentWeek: boolean;
}

type CourseScheduleItemData = { type: 'course' } & CourseScheduleItemDataBase;
type EmptyScheduleItemData = { type: 'empty' };
type ScheduleItemData = CourseScheduleItemData | EmptyScheduleItemData;

interface CalendarColProps {
  week: number;
  schedulesOnDay: CourseInfoMerged[];
  flatListLayout: LayoutRectangle;
}

// 课程表的一列，即一天的课程
const CalendarCol: React.FC<CalendarColProps> = ({ week, schedulesOnDay, flatListLayout }) => {
  const itemHeight = useMemo(
    () => Math.max(SCHEDULE_ITEM_MIN_HEIGHT, Math.floor(flatListLayout.height / 11)),
    [flatListLayout.height],
  );
  const setting = useCoursePageSetting();
  const { courseColorScheme } = useTheme();

  // 根据当前周数和星期几，筛选出当天的课程
  // 并进行整合，生成一个用于渲染的数据结构
  const scheduleData = useMemo(() => {
    // 主要的课程
    const mainCourses: CourseScheduleItemDataBase[] = [];

    // 排课前统一过滤免听课程，兼容没有 examType 的旧版自定义课程
    const visibleSchedules = setting.hiddenCoursesWithoutAttendances
      ? schedulesOnDay.filter(s => !s.examType?.includes(COURSE_WITHOUT_ATTENDANCE))
      : schedulesOnDay;

    // 先按优先级排本周的课和考试，重叠的不管
    const today = visibleSchedules
      .filter(
        s =>
          isCourseScheduledInWeek(s, week) && // 检查是否在本周有课（含单双周）
          (s.type === COURSE_TYPE ||
            (setting.exportExamToCourseTable && s.type === EXAM_TYPE) ||
            s.type === CUSTOM_TYPE), // 判断课程类型
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
        nonCurrentWeek: false,
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
      // 同一节课可能合并了常规和调课周段，仅有调课周段的课程不显示为灰色占位
      const nonCurrentWeek = visibleSchedules
        .filter(
          s =>
            s.type === COURSE_TYPE &&
            !isCourseScheduledInWeek(s, week) &&
            s.weekSegments.some(segment => !segment.isAdjusted),
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
          nonCurrentWeek: true,
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

  const { colors } = coursePalettes[courseColorScheme ?? setting.colorScheme];

  return (
    <View className="flex flex-shrink-0 flex-grow flex-col" style={{ width: flatListLayout.width / 7 }}>
      {scheduleData.map((item, index) => {
        if (item.type === 'empty') return <EmptyScheduleItem key={index} itemHeight={itemHeight} />;

        const course = item.schedules[0];
        const courseColor = course.type === COURSE_TYPE ? colors[course.color] : course.color;
        return (
          <ScheduleItem
            key={index}
            itemHeight={itemHeight}
            span={item.span}
            color={courseColor}
            nonCurrentWeek={item.nonCurrentWeek}
            schedules={item.schedules}
            week={week}
          />
        );
      })}
    </View>
  );
};

export default memo(CalendarCol);
