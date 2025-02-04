import type { Course, CourseScheduleRule } from '@/api/backend';
import type { CourseSetting } from '@/api/interface';
import { COURSE_SETTINGS_KEY } from '@/lib/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ParsedCourse = Omit<Course, 'rawAdjust' | 'rawScheduleRules' | 'scheduleRules'> & CourseScheduleRule;

// 解析课程数据，将课程数据中的 scheduleRules 展开，返回一个新的数组
export function parseCourses(courses: Course[]): ParsedCourse[] {
  const parsedCourses = courses.flatMap(course =>
    course.scheduleRules.map(rule => {
      const { rawAdjust, rawScheduleRules, scheduleRules, ...rest } = course;

      return {
        ...rest,
        ...rule,
      };
    }),
  );

  return parsedCourses;
}

// 根据学期开始日期和当前周数获取当前周的日期（会返回一个完整的一周）
export function getDatesByWeek(semesterStart: string, currentWeek: number): string[] {
  const startDate = new Date(semesterStart);
  const startDayOfWeek = (startDate.getDay() + 6) % 7; // 将星期日（0）转换为 6，其他天数减 1 对应星期一到星期六
  const adjustedStartDate = new Date(startDate);

  // 如果学期开始日期不是星期一，则调整到最近的星期一
  adjustedStartDate.setDate(startDate.getDate() - startDayOfWeek);

  const firstDayOfWeek = new Date(adjustedStartDate);
  firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (currentWeek - 1) * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(firstDayOfWeek);
    date.setDate(firstDayOfWeek.getDate() + i);
    return date.toISOString().split('T')[0]; // 返回日期字符串格式 YYYY-MM-DD
  });
}

// 根据学期开始日期和结束日期计算一学期一共有多少周
export function getWeeksBySemester(semesterStart: string, semesterEnd: string): number {
  const startDate = new Date(semesterStart);
  const endDate = new Date(semesterEnd);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.ceil(diffDays / 7);
}

const defaultCourseSetting: CourseSetting = {
  selectedSemester: '',
  calendarExportEnabled: false,
  showNonCurrentWeekCourses: false,
  autoImportAdjustmentEnabled: false,
};

// 本质是将传入的 courseSetting 与 defaultCourseSetting 合并
// 本质是将传入的 courseSetting 与 defaultCourseSetting 合并
export const normalizeCourseSetting = async (courseSetting: Partial<CourseSetting> | null): Promise<CourseSetting> => {
  // 如果传入的 courseSetting 为空，则写入默认设置到 AsyncStorage
  if (!courseSetting) {
    await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(defaultCourseSetting));
    return defaultCourseSetting;
  }

  // 合并默认设置和传入的设置
  const normalizedSetting = { ...defaultCourseSetting, ...courseSetting } as CourseSetting;

  // 将合并后的设置写入 AsyncStorage
  await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(normalizedSetting));

  return normalizedSetting;
};
