import type { JwchCourseListResponse_Course, JwchCourseListResponse_CourseScheduleRule } from '@/api/backend';
import type { CourseSetting } from '@/api/interface';
import { CLASS_SCHEDULES_MINUTES, COURSE_CURRENT_CACHE_KEY, COURSE_SETTINGS_KEY } from '@/lib/constants';
import { MergedExamData } from '@/types/academic';
import generateRandomColor, { clearColorMapping, getExamColor } from '@/utils/random-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import objectHash from 'object-hash';

export type ParsedCourse = Omit<JwchCourseListResponse_Course, 'rawAdjust' | 'rawScheduleRules' | 'scheduleRules'> &
  JwchCourseListResponse_CourseScheduleRule;

// 对课程类型的拓展，支持颜色等设计，也允许后期进行不断扩充
export interface ExtendCourse extends ParsedCourse {
  id: number; // 我们为每门课程分配一个唯一的 ID，后续可以用于识别
  color: string; // 课程颜色
  priority: number; // 优先级
  type: number; // 课程类型（0 = 普通课程， 1 = 考试）
}

interface CacheCourseData {
  data: Record<number, ExtendCourse[]>;
  priorityCounter: number;
  digest: string;
}

export const SCHEDULE_ITEM_MIN_HEIGHT = 49;
export const SCHEDULE_MIN_HEIGHT = SCHEDULE_ITEM_MIN_HEIGHT * 11;
const COURSE_TYPE = 0;
const EXAM_TYPE = 1;
const OVERTIME_THRESHOLD = 30; // 超时阈值，单位为分钟，用于解析时间段
const MAX_PRIORITY = 10000; // 最大优先级，达到这个优先级后会重新计数
const EXAM_PRIORITY = 10001; // 考试优先级，我们取巧一下，比最大的优先级还要大
const DEFAULT_PRIORITY = 1; // 默认优先级
const DEFAULT_STARTID = 1000; // 默认 ID 起始值

export class CourseCache {
  private static cachedDigest: string | null = null; // 缓存的课程数据的摘要
  private static cachedExamDigest: string | null = null; // 缓存的考试数据的摘要
  private static cachedData: Record<number, ExtendCourse[]> | null = null; // 缓存的课程数据
  private static cachedExamData: Record<number, ExtendCourse[]> | null = null; // 缓存的考试数据
  private static priorityCounter: number = DEFAULT_PRIORITY; // 静态优先级计数器，初始值为 1
  private static startID = DEFAULT_STARTID; // 从 1000 开始分配 ID

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
   * 分配一个新的独立 ID
   * @returns 新的 ID
   */
  private static allocateID(): number {
    return this.startID++;
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
   * 导入考场到课表中
   * @param exam - 考场数据
   * @returns 导入成功数量
   */
  public static mergeExamCourses(exam: MergedExamData[], semesterStart: string): Record<number, ExtendCourse[]> {
    if (!this.cachedData) {
      return [];
    }

    // 将 MergedExamData 转化为 ExtendCourse，优先级设置为最高
    for (const examItem of exam) {
      const { time, date } = examItem;
      if (!date) continue; // 如果没有日期，则不安排
      if (!time) continue; // 如果没有时间，则不安排

      const weekday = new Date(date).getDay(); // 获取日期所在一周的第几天
      const startDate = new Date(semesterStart); // 学期开始日期

      // 我们基于学期开始日期和考试日期，计算中间的周数
      const diffDays = Math.floor((new Date(date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7) + 1; // 计算周数

      // 填充课程数据
      try {
        const { startClass, endClass } = parseTimeToClass(time);
        const course: ExtendCourse = {
          id: this.allocateID(), // 分配新 ID
          priority: EXAM_PRIORITY, // 使用最高优先级
          color: getExamColor(), // 固定为一个明亮的颜色
          type: EXAM_TYPE, // 类型为考试
          name: '[考试] ' + examItem.name, // 特别标记
          teacher: examItem.teacher,
          location: examItem.location ?? '',
          startClass: startClass,
          endClass: endClass,
          startWeek: diffWeeks, // 考试只在某一周内
          endWeek: diffWeeks,
          weekday: weekday,
          single: true,
          double: true,
          adjust: false,
          remark: time, // 备注、课程大纲和教学计划设置为空
          syllabus: '',
          lessonplan: '',
        };
        // 将考试安排到 cachedData 中，cacheData 为按天归类的课程数据
        // 避免空指针异常，先判断是否存在 weekday
        if (!this.cachedData[weekday - 1]) {
          this.cachedData[weekday - 1] = [];
        }
        this.cachedData[weekday - 1].push(course);
      } catch (error) {
        console.error('Failed to parse time range:', error);
        continue;
      }
    }

    return this.cachedData;
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
  public static setCourses(
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

    // 为每个课程生成颜色并扩展数据
    const extendedCourses: ExtendCourse[] = schedules.map(schedule => {
      if (!courseColorMap[schedule.name]) {
        courseColorMap[schedule.name] = generateRandomColor(schedule.name, colorScheme === 'dark');
      }
      return {
        ...schedule,
        color: courseColorMap[schedule.name],
        priority: 0, // 默认优先级为 0
        id: this.allocateID(), // 分配一个新的 ID
        type: COURSE_TYPE,
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

/**
 * 将时间字符串转换为分钟数
 * @param time 时间字符串，格式为 "hh:mm"
 */
const timeToMinutes = (time: string): number => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

/**
 * 根据时间字符串解析对应的课程节次范围。本质是将时间转化为分钟数，然后根据节次时间范围进行推断。
 * @param timeRange 时间范围字符串，格式为 "hh:mm-hh:mm"
 * @returns 推断的开始节次和结束节次
 */
const parseTimeToClass = (timeRange: string): { startClass: number; endClass: number } => {
  const [startTimeStr, endTimeStr] = timeRange.split('-'); // 分割时间段
  const startTime = timeToMinutes(startTimeStr); // 转换为分钟数
  const endTime = timeToMinutes(endTimeStr); // 转换为分钟数

  let startClass = -1;
  let endClass = -1;

  for (let i = 0; i < CLASS_SCHEDULES_MINUTES.length; i++) {
    const [classStart, classEnd] = CLASS_SCHEDULES_MINUTES[i];

    // 处理开始时间的“四舍五入”规则
    // 例如，当扫描到 10:00 - 12:00 时，我们课表里离 10:00 最近的是 09:15 - 10:00 的课程，以及 10:20 - 11:05 的课程
    // 那此时这个 10:00 应当渲染 10:20 - 12:00 这两门课，所以也是进位问题
    if (
      startClass === -1 &&
      ((startTime >= classStart && startTime <= classEnd) || // 时间在当前节次范围内
        (startTime >= classStart - OVERTIME_THRESHOLD && startTime < classStart)) // 提前不超过阈值
    ) {
      const diffToStart = Math.abs(startTime - classStart); // 距离这节课开始的时间

      if (startTime <= classStart && diffToStart <= OVERTIME_THRESHOLD) {
        startClass = i + 1; // 提前不超过 30 分钟，允许
      } else if (startTime > classStart && startTime < classEnd) {
        if (diffToStart <= 15) {
          startClass = i + 1; // 退位到当前节次
        } else {
          startClass = i + 2; // 进位到下一节课
        }
      }
    }

    // 处理结束时间的“四舍五入”规则
    // 这个比前面好判断，因为我们只需要判断是否在当前节次范围内，或者超时不超过阈值
    if (
      endClass === -1 &&
      ((endTime >= classStart && endTime <= classEnd) || // 时间在当前节次范围内
        (endTime > classEnd && endTime <= classEnd + OVERTIME_THRESHOLD)) // 超时不超过阈值
    ) {
      const overtime = endTime - classEnd;
      if (overtime <= OVERTIME_THRESHOLD) {
        // 超时不超过 30 分钟，舍去超出部分
        endClass = i + 1;
      } else if (i + 1 < CLASS_SCHEDULES_MINUTES.length) {
        // 超时超过 30 分钟，进一节课
        endClass = i + 2;
      }
    }
  }

  if (startClass === -1 || endClass === -1) {
    throw new Error('Invalid time range');
  }

  return { startClass, endClass };
};

// 课程设置

export const defaultCourseSetting: CourseSetting = {
  selectedSemester: '',
  calendarExportEnabled: false,
  showNonCurrentWeekCourses: false,
  exportExamToCourseTable: false,
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
