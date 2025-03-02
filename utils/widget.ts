import { getApiV1TermsList } from '@/api/generate';
import { COURSE_TERMS_LIST_KEY, EXPIRE_ONE_DAY } from '@/lib/constants';
import { CourseCache, ExtendCourse, readCourseSetting } from '@/lib/course';
import locateDate, { getWeeksBySemester } from '@/lib/locate-date';
import { fetchWithCache } from './fetch-with-cache';

// 定义课程信息返回类型
export interface ClassInfo {
  week: number;
  courseInfo: ExtendCourse;
}

// 获取下一节课数据
export async function getNextClass(): Promise<ClassInfo | null> {
  // 加载缓存的课程数据
  await CourseCache.load();

  // 如果没有缓存数据，返回 null
  if (!CourseCache.hasCachedData()) {
    return null;
  }

  // 获取当前日期、周次和星期几
  const { week } = await locateDate();

  // 获取所有课程数据（包括考试）
  const allCourseData = CourseCache.getCachedData();

  // 获取当前时间，用于判断下一节课
  const currentClassTime = getNextClassTime();

  // 调用查找下一节课的函数
  return findNextClass(week, currentClassTime, allCourseData);
}

// 获取当前/下一节课时间
function getNextClassTime(): ClassTime {
  const d = new Date();
  const hour = d.getHours();
  const minute = d.getMinutes();

  const weekday = ((d.getDay() + 6) % 7) + 1; // JavaScript 中的 getDay 返回值是 0-6, 转换成 1-7

  let time: number;

  if (hour < 8 || (hour === 8 && minute < 20)) {
    time = 1;
  } else if (hour < 9 || (hour === 9 && minute < 15)) {
    time = 2;
  } else if (hour < 10 || (hour === 10 && minute < 20)) {
    time = 3;
  } else if (hour < 11 || (hour === 11 && minute < 15)) {
    time = 4;
  } else if (hour < 14) {
    time = 5;
  } else if (hour === 14 && minute < 55) {
    time = 6;
  } else if (hour < 15 || (hour === 15 && minute < 50)) {
    time = 7;
  } else if (hour < 16 || (hour === 16 && minute < 45)) {
    time = 8;
  } else if (hour < 17 || hour < 19) {
    time = 9;
  } else if (hour === 19 && minute < 55) {
    time = 10;
  } else if (hour < 20 || (hour === 20 && minute < 50)) {
    time = 11;
  } else {
    time = 12;
  }

  return { weekday, section: time };
}

// 查找下一节课
async function findNextClass(
  currentWeek: number,
  classTime: ClassTime,
  coursesData: Record<number, ExtendCourse[]>,
): Promise<ClassInfo | null> {
  let week = currentWeek;
  let weekday = classTime.weekday;
  let section = classTime.section;

  const { data: termsData } = await fetchWithCache([COURSE_TERMS_LIST_KEY], () => getApiV1TermsList(), EXPIRE_ONE_DAY);
  const terms = termsData.data.terms;
  const { selectedSemester } = await readCourseSetting();
  const currentTerm = terms.find(term => term.term === selectedSemester);
  if (!currentTerm) {
    return null;
  }
  const maxWeek = getWeeksBySemester(currentTerm.start_date, currentTerm.end_date);

  // 循环查找下一节课
  while (week <= maxWeek) {
    // 一天的索引为 weekday - 1
    const dayIndex = weekday - 1;
    const dayClasses = coursesData[dayIndex] || [];

    // 按优先级排序（考试优先级最高）
    const sortedClasses = [...dayClasses].sort((a, b) => b.priority - a.priority);

    for (const course of sortedClasses) {
      // 检查周次是否匹配
      if (
        week < course.startWeek ||
        week > course.endWeek ||
        (course.single && week % 2 !== 1) ||
        (course.double && week % 2 !== 0)
      ) {
        continue;
      }

      // 检查节次是否匹配
      if (course.startClass === section) {
        return {
          week,
          courseInfo: course,
        };
      }
    }

    // 移动到下一节课、下一天或下一周
    if (section < 12) {
      section++;
    } else if (weekday < 7) {
      weekday++;
      section = 1;
    } else {
      week++;
      weekday = 1;
      section = 1;
    }
  }

  return null;
}

// 时间类型定义
interface ClassTime {
  weekday: number; // 1-7 表示周一到周日
  section: number; // 1-12 表示第1节到第12节课
}
