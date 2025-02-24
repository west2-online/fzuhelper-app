import type { JwchCourseListResponse_Course, JwchCourseListResponse_CourseScheduleRule } from '@/api/backend';
import type { CourseSetting } from '@/api/interface';
import { COURSE_CURRENT_CACHE_KEY, COURSE_SETTINGS_KEY } from '@/lib/constants';
import generateRandomColor, { clearColorMapping } from '@/utils/random-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import objectHash from 'object-hash';

export type ParsedCourse = Omit<JwchCourseListResponse_Course, 'rawAdjust' | 'rawScheduleRules' | 'scheduleRules'> &
  JwchCourseListResponse_CourseScheduleRule;

// 对课程类型的拓展，支持颜色等设计，也允许后期进行不断扩充
export interface ExtendCourse extends ParsedCourse {
  id: number; // 我们为每门课程分配一个唯一的 ID，后续可以用于识别
  color: string; // 课程颜色
  priority: number; // 优先级
}

interface CacheCourseData {
  data: Record<number, ExtendCourse[]>;
  priorityCounter: number;
  digest: string;
}

export const SCHEDULE_ITEM_MIN_HEIGHT = 49;
export const SCHEDULE_MIN_HEIGHT = SCHEDULE_ITEM_MIN_HEIGHT * 11;
const MAX_PRIORITY = 10000; // 最大优先级，达到这个优先级后会重新计数
const DEFAULT_PRIORITY = 1; // 默认优先级
const DEFAULT_STARTID = 1000; // 默认 ID 起始值

export class CourseCache {
  private static cachedDigest: string | null = null; // 缓存的课程数据的摘要
  private static cachedData: Record<number, ExtendCourse[]> | null = null; // 缓存的课程数据
  private static priorityCounter: number = DEFAULT_PRIORITY; // 静态优先级计数器，初始值为 1

  /**
   * 获取缓存数据
   */
  public static getCachedData(): Record<number, ExtendCourse[]> {
    return this.cachedData ?? [];
  }

  /**
   * 加载缓存数据
   */
  public static async load(): Promise<void> {
    const resp = await AsyncStorage.getItem(COURSE_CURRENT_CACHE_KEY);
    if (!resp) {
      return;
    }
    const result = JSON.parse(resp) as CacheCourseData;
    this.cachedDigest = result.digest;
    this.cachedData = result.data;
    this.priorityCounter = result.priorityCounter;
    console.log('Loaded cached course data.');
  }

  /**
   * 保存缓存数据
   */
  private static async save(): Promise<void> {
    await AsyncStorage.setItem(
      COURSE_CURRENT_CACHE_KEY,
      JSON.stringify({
        data: this.cachedData,
        digest: this.cachedDigest,
        priorityCounter: this.priorityCounter,
      }),
    );
  }

  /**
   * 清除缓存数据
   */
  public static async clear(): Promise<void> {
    this.cachedDigest = null;
    this.cachedData = null;
    this.priorityCounter = DEFAULT_PRIORITY; // 重置优先级计数器
    await AsyncStorage.removeItem(COURSE_CURRENT_CACHE_KEY);
  }

  /**
   * 设置摘要
   * @param digest - 数据摘要
   */
  public static async setDigest(digest: string): Promise<void> {
    this.cachedDigest = digest;
    await this.save();
  }

  /**
   * 手动为某门课程设置优先级
   * @param courseID - 课程 ID
   * @param priority - 优先级
   */
  public static async setPriority(courseID: number): Promise<void> {
    if (!this.cachedData) {
      return;
    }

    const updatedData = Object.values(this.cachedData).map(day =>
      day.map(course => {
        if (course.id === courseID) {
          console.log(`Set priority for course ${course.name} to ${this.priorityCounter}`);
          this.priorityCounter = (this.priorityCounter + 1) % MAX_PRIORITY;
          return {
            ...course,
            priority: this.priorityCounter, // 设置优先级并自增计数器
          };
        }
        return course;
      }),
    );

    this.cachedData = updatedData;
    await this.save();
  }

  /**
   * 计算课程数据的摘要
   * @param data - 课程数据
   * @returns 数据摘要
   */
  public static calculateDigest(data: JwchCourseListResponse_Course[]): string {
    return objectHash(data);
  }

  /**
   * 计算摘要并和当前缓存的摘要进行比较
   * @param data - 课程数据
   * @returns 是否和当前缓存的数据一致
   */
  public static compareDigest(data: JwchCourseListResponse_Course[]): boolean {
    return this.calculateDigest(data) === this.cachedDigest;
  }

  /**
   * 解析课程数据
   * @param courses - 原始课程数据
   * @returns 解析后的课程数据
   */
  private static parseCourses(courses: JwchCourseListResponse_Course[]): ParsedCourse[] {
    return courses.flatMap(course =>
      course.scheduleRules.map(rule => {
        const { rawAdjust, rawScheduleRules, scheduleRules, ...rest } = course;
        return {
          ...rest,
          ...rule,
        };
      }),
    );
  }

  /**
   * 转换课程数据为扩展课程数据
   * @param tempData - 接口返回的数据
   * @param colorScheme - 当前的配色方案（'dark' 或 'light'）
   * @returns 按天归类的课程数据
   */
  public static transferToExtendCourses(
    tempData: JwchCourseListResponse_Course[],
    colorScheme: 'dark' | 'light' | null | undefined,
  ): Record<number, ExtendCourse[]> {
    // 生成当前 tempData 的 digest
    const currentDigest = this.calculateDigest(tempData);

    // 如果当前 digest 和上一次的 digest 一致，则直接返回缓存的 data
    if (currentDigest === this.cachedDigest && this.cachedData) {
      return this.cachedData;
    }

    // 否则，重新处理数据
    const schedules = this.parseCourses(tempData); // 解析课程数据

    clearColorMapping(); // 清空颜色映射
    const courseColorMap: Record<string, string> = {}; // 用于存储课程与颜色的映射关系

    let startID = DEFAULT_STARTID; // 从 1000 开始分配 ID

    // 为每个课程生成颜色并扩展数据
    const extendedCourses: ExtendCourse[] = schedules.map(schedule => {
      if (!courseColorMap[schedule.name]) {
        courseColorMap[schedule.name] = generateRandomColor(schedule.name, colorScheme === 'dark');
      }
      return {
        ...schedule,
        color: courseColorMap[schedule.name],
        priority: 0, // 默认优先级为 0
        id: startID++, // 生成一个随机 ID
      };
    });

    // 按天归类课程数据
    const groupedData = extendedCourses.reduce(
      (result, current) => {
        const day = current.weekday - 1;
        if (!result[day]) result[day] = [];
        result[day].push(current);
        return result;
      },
      {} as Record<number, ExtendCourse[]>,
    );

    // 更新缓存
    this.cachedDigest = currentDigest;
    this.cachedData = groupedData;

    this.save(); // 缓存数据

    return groupedData;
  }
}

// 根据学期开始日期和当前周数获取当前周的第一天日期
export function getFirstDateByWeek(semesterStart: string, currentWeek: number): string {
  const startDate = new Date(semesterStart);
  const startDayOfWeek = (startDate.getDay() + 6) % 7; // 将星期日（0）转换为 6，其他天数减 1 对应星期一到星期六
  const adjustedStartDate = new Date(startDate);

  // 如果学期开始日期不是星期一，则调整到最近的星期一
  adjustedStartDate.setDate(startDate.getDate() - startDayOfWeek);

  const firstDayOfWeek = new Date(adjustedStartDate);
  firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (currentWeek - 1) * 7);

  return firstDayOfWeek.toISOString().split('T')[0]; // 返回日期字符串格式 YYYY-MM-DD
}

// 根据学期开始日期和当前周数获取当前周的日期（会返回一个完整的一周）
export function getDatesByWeek(semesterStart: string, currentWeek: number): string[] {
  const firstDayOfWeek = new Date(getFirstDateByWeek(semesterStart, currentWeek));
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

export const defaultCourseSetting: CourseSetting = {
  selectedSemester: '',
  calendarExportEnabled: false,
  showNonCurrentWeekCourses: false,
};

// 将传入的 courseSetting 与 defaultCourseSetting 合并
export const normalizeCourseSetting = (courseSetting: Partial<CourseSetting> = {}): CourseSetting => {
  // 如果传入的 courseSetting 为空，则返回默认设置
  if (!courseSetting) {
    return defaultCourseSetting;
  }

  // 合并默认设置和传入的设置
  return { ...defaultCourseSetting, ...courseSetting } as CourseSetting;
};

// 读取课程设置
export const readCourseSetting = async (): Promise<CourseSetting> => {
  const setting = await AsyncStorage.getItem(COURSE_SETTINGS_KEY);

  if (!setting) {
    await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(defaultCourseSetting));
    return defaultCourseSetting;
  }

  const config = normalizeCourseSetting(JSON.parse(setting));
  await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(config));

  return config;
};
