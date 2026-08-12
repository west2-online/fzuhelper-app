export const WIDGET_STORE_NAME: string = 'fzuhelper_widget';
export const WIDGET_DATA_KEY: string = 'widget_data';
export const WIDGET_FORM_IDS_KEY: string = 'form_ids';

interface WidgetCourse {
  name: string;
  location: string;
  startClass: number;
  endClass: number;
  startWeek: number;
  endWeek: number;
  weekday: number;
  single: boolean;
  double: boolean;
  remark: string;
  priority: number;
  examType?: string;
}

interface WidgetCourseCache {
  courseData?: Record<string, WidgetCourse[]>;
  examData?: Record<string, WidgetCourse[]>;
  customData?: Record<string, WidgetCourse[]>;
  startDate: string;
  maxWeek: number;
  hiddenCoursesWithoutAttendances?: boolean;
}

interface ClassTime {
  weekday: number;
  section: number;
}

export interface WidgetBindingData {
  courseName: string;
  courseLocation: string;
  courseSection: string;
  courseWeek: string;
  courseWeekday: string;
  statusText: string;
}

interface NextClass {
  week: number;
  course: WidgetCourse;
}

export function buildWidgetBindingData(json: string): WidgetBindingData {
  if (json.length === 0) {
    return emptyWidgetData('本地没有数据', '请打开课表设置刷新');
  }

  try {
    const cache = JSON.parse(json) as WidgetCourseCache;
    const nextClass = findNextClass(cache);
    if (nextClass === undefined) {
      return emptyWidgetData('放假啦', '当前学期没有后续课程');
    }
    const course = nextClass.course;
    return {
      courseName: truncate(course.name, 13),
      courseLocation: truncate(course.location, 10),
      courseSection: truncate(
        course.remark.length > 0 ? course.remark : `${course.startClass}-${course.endClass}节`,
        10,
      ),
      courseWeek: `第${nextClass.week}周`,
      courseWeekday: `周${weekChinese(course.weekday)}`,
      statusText: '',
    };
  } catch (error) {
    return emptyWidgetData('课程数据异常', '请在应用内重新刷新课表');
  }
}

function findNextClass(cache: WidgetCourseCache): NextClass | undefined {
  const startTime = parseLocalDate(cache.startDate);
  if (!Number.isFinite(startTime) || cache.maxWeek <= 0) {
    return undefined;
  }
  const now = new Date();
  let week = now.getTime() < startTime
    ? 1
    : Math.max(1, Math.floor((now.getTime() - startTime) / 604_800_000) + 1);
  const classTime = getNextClassTime(now, startTime);
  let weekday = classTime.weekday;
  let section = classTime.section;
  const courses = getCourses(cache);

  while (week <= cache.maxWeek) {
    for (let index = 0; index < courses.length; index += 1) {
      const course = courses[index];
      const weekMatches = week >= course.startWeek
        && week <= course.endWeek
        && ((course.single && week % 2 === 1) || (course.double && week % 2 === 0));
      if (weekMatches && weekday === course.weekday && section === course.startClass) {
        return { week, course };
      }
    }

    if (section < 11) {
      section += 1;
    } else if (weekday < 7) {
      weekday += 1;
      section = 1;
    } else {
      week += 1;
      weekday = 1;
      section = 1;
    }
  }
  return undefined;
}

function parseLocalDate(value: string): number {
  const segments = value.split('-');
  if (segments.length !== 3) {
    return Number.NaN;
  }
  const year = Number.parseInt(segments[0], 10);
  const month = Number.parseInt(segments[1], 10);
  const day = Number.parseInt(segments[2], 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return Number.NaN;
  }
  return new Date(year, month - 1, day).getTime();
}

function getCourses(cache: WidgetCourseCache): WidgetCourse[] {
  const result: WidgetCourse[] = [];
  appendCourseRecord(result, cache.courseData, cache.hiddenCoursesWithoutAttendances === true);
  appendCourseRecord(result, cache.examData, false);
  appendCourseRecord(result, cache.customData, false);
  result.sort((left: WidgetCourse, right: WidgetCourse) => right.priority - left.priority);
  return result;
}

function appendCourseRecord(
  result: WidgetCourse[],
  record: Record<string, WidgetCourse[]> | undefined,
  hideWithoutAttendance: boolean,
): void {
  if (record === undefined) {
    return;
  }
  const keys = Object.keys(record);
  for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    const courses = record[keys[keyIndex]];
    for (let courseIndex = 0; courseIndex < courses.length; courseIndex += 1) {
      const course = courses[courseIndex];
      if (
        !hideWithoutAttendance
        || course.examType === undefined
        || !course.examType.includes('免听')
      ) {
        result.push(course);
      }
    }
  }
}

function getNextClassTime(now: Date, startTime: number): ClassTime {
  if (now.getTime() < startTime) {
    return { weekday: 1, section: 1 };
  }
  const hour = now.getHours();
  const minute = now.getMinutes();
  const weekday = (now.getDay() + 6) % 7 + 1;
  let section = 12;
  if (hour < 8 || (hour === 8 && minute < 20)) {
    section = 1;
  } else if (hour < 9 || (hour === 9 && minute < 15)) {
    section = 2;
  } else if (hour < 10 || (hour === 10 && minute < 20)) {
    section = 3;
  } else if (hour < 11 || (hour === 11 && minute < 15)) {
    section = 4;
  } else if (hour < 14) {
    section = 5;
  } else if (hour === 14 && minute < 55) {
    section = 6;
  } else if (hour < 15 || (hour === 15 && minute < 50)) {
    section = 7;
  } else if (hour < 16 || (hour === 16 && minute < 45)) {
    section = 8;
  } else if (hour < 19) {
    section = 9;
  } else if (hour === 19 && minute < 55) {
    section = 10;
  } else if (hour < 20 || (hour === 20 && minute < 50)) {
    section = 11;
  }
  return { weekday, section };
}

function emptyWidgetData(courseName: string, statusText: string): WidgetBindingData {
  return {
    courseName,
    courseLocation: '',
    courseSection: '',
    courseWeek: '',
    courseWeekday: '',
    statusText,
  };
}

function truncate(value: string, limit: number): string {
  return value.length >= limit ? `${value.substring(0, limit - 2)}...` : value;
}

function weekChinese(weekday: number): string {
  const names: string[] = ['无', '一', '二', '三', '四', '五', '六', '日'];
  return weekday >= 1 && weekday <= 7 ? names[weekday] : names[0];
}
