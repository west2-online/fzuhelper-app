import type { CourseSetting } from '@/api/interface';
import { CLASS_SCHEDULES_MINUTES, COURSE_WITHOUT_ATTENDANCE, CourseType } from '@/lib/constants';
import type { CourseInfo } from '@/lib/course';
import { isWeekInSegment } from '@/lib/course-schedule';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export interface WidgetCourseEvent {
  date: string;
  name: string;
  location: string;
  remark: string;
  startMinute: number;
  endMinute: number;
}

// 两端原生小组件共用的数据协议
export interface CourseWidgetSnapshot {
  version: 2;
  timeZone: string;
  startDate: string;
  endDate: string;
  events: WidgetCourseEvent[];
}

interface WidgetSnapshotInput {
  courses: CourseInfo[];
  startDate: string;
  endDate: string;
  settings: Pick<CourseSetting, 'hiddenCoursesWithoutAttendances' | 'exportExamToCourseTable'>;
}

export function buildCourseWidgetSnapshot({
  courses,
  startDate,
  endDate,
  settings,
}: WidgetSnapshotInput): CourseWidgetSnapshot {
  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).startOf('day');
  // 与课表一致，以开学当周的周一作为第一周起点。
  const weekStart = start.startOf('isoWeek');
  const events: WidgetCourseEvent[] = [];
  const visibleCourses = courses
    .filter(course => course.type !== CourseType.EXAM || settings.exportExamToCourseTable)
    .filter(
      course => !settings.hiddenCoursesWithoutAttendances || !course.examType?.includes(COURSE_WITHOUT_ATTENDANCE),
    )
    .sort((left, right) => left.startClass - right.startClass || right.priority - left.priority);

  for (let date = start; !date.isAfter(end); date = date.add(1, 'day')) {
    const week = date.diff(weekStart, 'week') + 1;
    const weekday = ((date.day() + 6) % 7) + 1;
    const dayEvents = new Map<string, WidgetCourseEvent>();

    for (const course of visibleCourses) {
      if (course.weekday !== weekday || !isWeekInSegment(course, week)) continue;

      let startMinute = CLASS_SCHEDULES_MINUTES[course.startClass - 1]?.[0];
      let endMinute = CLASS_SCHEDULES_MINUTES[course.endClass - 1]?.[1];
      let remark = course.remark;

      // 考试的实际时间保存在备注中，不能用近似节次代替。
      if (course.type === CourseType.EXAM) {
        const time = course.remark.match(/^(\d{1,2}):(\d{2})\s*[-–—~～]\s*(\d{1,2}):(\d{2})$/);
        if (time) {
          startMinute = Number(time[1]) * 60 + Number(time[2]);
          endMinute = Number(time[3]) * 60 + Number(time[4]);
          remark = '';
        }
      }

      if (startMinute === undefined || endMinute === undefined || startMinute >= endMinute) continue;

      const name = course.name.replace(/^\[调课\]\s*/, '');
      const key = JSON.stringify([course.type, name, course.location, startMinute, endMinute]);
      if (dayEvents.has(key)) continue;

      dayEvents.set(key, {
        date: date.format('YYYY-MM-DD'),
        name,
        location: course.location,
        remark,
        startMinute,
        endMinute,
      });
    }

    events.push(...Array.from(dayEvents.values()).sort((left, right) => left.startMinute - right.startMinute));
  }

  return { version: 2, timeZone: 'Asia/Shanghai', startDate, endDate, events };
}
