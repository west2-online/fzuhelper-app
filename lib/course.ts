import type { JwchCourseListResponse_Course, JwchCourseListResponse_CourseScheduleRule } from '@/api/backend';
import type { CourseSetting } from '@/api/interface';
import {
  CLASS_BREAK_EVENING,
  CLASS_BREAK_NOON,
  CLASS_SCHEDULES_MINUTES,
  COURSE_CURRENT_CACHE_KEY,
  COURSE_SETTINGS_KEY,
  COURSE_TERMS_LIST_KEY,
  IOS_APP_GROUP,
} from '@/lib/constants';
import { setWidgetData } from '@/modules/native-widget';
import { MergedExamData } from '@/types/academic';
import { randomUUID } from '@/utils/crypto';
import { allocateColorForCourse, clearColorMapping, courseColors, getExamColor } from '@/utils/random-color';
import { ExtensionStorage } from '@bacons/apple-targets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import objectHash from 'object-hash';
import { Platform } from 'react-native';
import { getWeeksBySemester } from './locate-date';

export type ParsedCourse = Omit<JwchCourseListResponse_Course, 'rawAdjust' | 'rawScheduleRules' | 'scheduleRules'> &
  JwchCourseListResponse_CourseScheduleRule;

// 对课程类型的拓展，支持颜色等设计，也允许后期进行不断扩充
interface ExtendCourseBase extends ParsedCourse {
  id: number; // 我们为每门课程分配一个唯一的 ID，后续可以用于识别
  color: string; // 课程颜色
  priority: number; // 优先级
}

export type ExtendCourse = ExtendCourseBase & {
  type: 0 | 1 | 2; // 课程类型（0 = 普通课程，1 = 考试，2 = 自定义课程）
};

export type CustomCourse = ExtendCourseBase & {
  type: 2;
  storageKey: string; // 预留给后端的存储 key
  lastUpdateTime: string; // 最后更新时间
};

export type CourseInfo = ExtendCourse | CustomCourse;

interface CacheCourseData {
  courseData: Record<number, ExtendCourse[]>; // 课程数据
  courseDigest: string;
  examData: Record<number, ExtendCourse[]>; // 考试数据
  examDigest: string;
  customData: Record<number, CustomCourse[]>; // 自定义数据
  customDigest: string;
  lastCourseUpdateTime: string;
  lastExamUpdateTime: string;
  priorityCounter: number;
}

export const SCHEDULE_ITEM_MARGIN = 1;
export const SCHEDULE_ITEM_MIN_HEIGHT = 49;
export const SCHEDULE_MIN_HEIGHT = SCHEDULE_ITEM_MIN_HEIGHT * 11;
export const LEFT_TIME_COLUMN_WIDTH = 32;
export const TOP_CALENDAR_HEIGHT = 72;

export const COURSE_TYPE = 0;
export const EXAM_TYPE = 1;
export const CUSTOM_TYPE = 2;
export const COURSE_WITHOUT_ATTENDANCE = '免听';

const NO_LOADING_MSG = '未加载';
const OVERTIME_THRESHOLD = 30; // 超时阈值，单位为分钟，用于解析时间段
const MAX_PRIORITY = 10000; // 普通课程最大优先级，达到这个优先级后会重新计数
const EXAM_PRIORITY = 20002; // 考试优先级，我们取巧一下，比最大的优先级还要大
export const DEFAULT_PRIORITY = 1; // 默认优先级
const DEFAULT_STARTID = 0; // 默认 ID 起始值

export class CourseCache {
  private static cachedDigest: string | null = null; // 缓存的课程数据的摘要
  private static cachedExamDigest: string | null = null; // 缓存的考试数据的摘要
  private static cachedCustomDigest: string | null = null; // 缓存的自定义课程数据的摘要
  private static cachedData: Record<number, ExtendCourse[]> | null = null; // 缓存的课程数据
  private static cachedExamData: Record<number, ExtendCourse[]> | null = null; // 缓存的考试数据
  private static cachedCustomData: Record<number, CustomCourse[]> | null = null; // 缓存的自定义课程数据
  private static priorityCounter: number = DEFAULT_PRIORITY; // 静态优先级计数器，初始值为 1
  private static startID = DEFAULT_STARTID; // 从 1000 开始分配 ID
  private static lastCourseUpdateTime: string = NO_LOADING_MSG;
  private static lastExamUpdateTime: string = NO_LOADING_MSG;

  // 刷新回调列表
  private static refreshListeners: (() => void)[] = [];

  // 注册刷新回调
  public static addRefreshListener(listener: () => void): void {
    this.refreshListeners.push(listener);
  }

  // 移除刷新回调
  public static removeRefreshListener(listener: () => void): void {
    this.refreshListeners = this.refreshListeners.filter(l => l !== listener);
  }

  // 触发刷新事件
  public static refresh(): void {
    this.refreshListeners.forEach(listener => listener());
  }

  /**
   * 获取上次课程数据更新时间，转化为文本
   * @returns 上次课程数据更新时间
   */
  public static getLastCourseUpdateTime(): string {
    return this.lastCourseUpdateTime;
  }

  /**
   * 获取上次课程数据更新时间。
   * @returns 上次考场数据更新时间
   */
  public static getLastExamUpdateTime(): string {
    return this.lastExamUpdateTime;
  }

  /**
   * 判断是否有缓存数据，不需要判断考试缓存
   */
  public static hasCachedData(): boolean {
    return !!this.cachedData && !!this.cachedDigest;
  }

  /**
   * 获取缓存数据
   */
  public static getCachedData(): Record<number, CourseInfo[]> | null {
    const mergedData: Record<number, CourseInfo[]> = {};

    if (!this.cachedData && !this.cachedExamData) {
      return null;
    }

    // 合并课程数据
    if (this.cachedData) {
      for (const [day, courses] of Object.entries(this.cachedData)) {
        const dayIndex = Number(day);
        if (!mergedData[dayIndex]) mergedData[dayIndex] = [];
        mergedData[dayIndex].push(...courses);
      }
    }

    // 合并考试数据
    if (this.cachedExamData) {
      for (const [day, exams] of Object.entries(this.cachedExamData)) {
        const dayIndex = Number(day);
        if (!mergedData[dayIndex]) mergedData[dayIndex] = [];
        mergedData[dayIndex].push(...exams);
      }
    }

    // 合并自定义课程数据
    if (this.cachedCustomData) {
      for (const [day, customs] of Object.entries(this.cachedCustomData)) {
        const dayIndex = Number(day);
        if (!mergedData[dayIndex]) mergedData[dayIndex] = [];
        mergedData[dayIndex].push(...customs);
      }
    }

    return mergedData;
  }

  /**
   * 加载缓存数据
   */
  public static async load(): Promise<void> {
    // 课程数据
    const resp = await AsyncStorage.getItem(COURSE_CURRENT_CACHE_KEY);
    if (!resp) return;

    const result = JSON.parse(resp) as CacheCourseData;
    this.cachedDigest = result.courseDigest;
    this.cachedData = result.courseData;
    this.cachedExamDigest = result.examDigest;
    this.cachedExamData = result.examData;
    this.cachedCustomData = result.customData;
    this.cachedCustomDigest = result.customDigest;
    this.priorityCounter = result.priorityCounter;
    this.lastCourseUpdateTime = result.lastCourseUpdateTime;
    this.lastExamUpdateTime = result.lastExamUpdateTime;
    console.log('Loaded cached course data.');
  }

  /**
   * 保存缓存数据
   */
  public static async save(): Promise<void> {
    await AsyncStorage.setItem(
      COURSE_CURRENT_CACHE_KEY,
      JSON.stringify({
        courseData: this.cachedData,
        courseDigest: this.cachedDigest,
        examData: this.cachedExamData,
        examDigest: this.cachedExamDigest,
        customData: this.cachedCustomData,
        customDigest: this.cachedCustomDigest,
        priorityCounter: this.priorityCounter,
        lastCourseUpdateTime: this.lastCourseUpdateTime,
        lastExamUpdateTime: this.lastExamUpdateTime,
      } as CacheCourseData),
    );

    // 将数据保存到原生共享存储中，以便在小组件中调用
    const termsList = JSON.parse((await AsyncStorage.getItem(COURSE_TERMS_LIST_KEY)) ?? '[]');
    const courseSettings = await readCourseSetting();
    const term = courseSettings.selectedSemester;
    const currentTerm = termsList.data.data.data.terms.find((termData: any) => termData.term === term);
    const maxWeek = getWeeksBySemester(currentTerm.start_date, currentTerm.end_date);
    const showNonCurrentWeekCourses = courseSettings.showNonCurrentWeekCourses;
    const hiddenCoursesWithoutAttendances = courseSettings.hiddenCoursesWithoutAttendances;
    if (Platform.OS === 'ios') {
      // 这里不能和安卓那样直接用 package，因为这个 identifier 可能会有多个
      // 只能在常量中定义这个 identifier
      const storage = new ExtensionStorage(IOS_APP_GROUP);
      storage.set(
        COURSE_CURRENT_CACHE_KEY,
        JSON.stringify({
          courseData: this.cachedData,
          examData: this.cachedExamData,
          customData: this.cachedCustomData,
          lastCourseUpdateTime: this.lastCourseUpdateTime,
          lastExamUpdateTime: this.lastExamUpdateTime,
          startDate: currentTerm.start_date,
          maxWeek: maxWeek,
        }),
      ); // 如果要改这个 KEY，需要同步修改 target 中原生代码
      ExtensionStorage.reloadWidget(); // 保存后需要重载一次
    } else if (Platform.OS === 'android') {
      setWidgetData(
        JSON.stringify({
          courseData: this.cachedData,
          examData: this.cachedExamData,
          customData: this.cachedCustomData,
          startDate: currentTerm.start_date,
          maxWeek: maxWeek,
          showNonCurrentWeekCourses: showNonCurrentWeekCourses,
          hiddenCoursesWithoutAttendances: hiddenCoursesWithoutAttendances,
        }),
        Constants.expoConfig?.android?.package,
      );
    }
    console.log('Saved cached course data to widget.');
  }

  /**
   * 清除缓存数据
   */
  public static async clear(): Promise<void> {
    this.cachedDigest = null;
    this.cachedData = null;
    this.cachedExamData = null;
    this.cachedExamDigest = null;
    this.cachedCustomData = null;
    this.cachedCustomDigest = null;
    this.lastCourseUpdateTime = NO_LOADING_MSG;
    this.lastExamUpdateTime = NO_LOADING_MSG;
    this.priorityCounter = DEFAULT_PRIORITY; // 重置优先级计数器
    this.startID = DEFAULT_STARTID; // 重置 ID 计数器
    await AsyncStorage.removeItem(COURSE_CURRENT_CACHE_KEY);

    // 清除小组件数据
    if (Platform.OS === 'ios') {
      const storage = new ExtensionStorage(IOS_APP_GROUP);
      storage.set(COURSE_CURRENT_CACHE_KEY, '');
      ExtensionStorage.reloadWidget(); // 保存后需要重载一次
    } else if (Platform.OS === 'android') {
      setWidgetData('', Constants.expoConfig?.android?.package);
    }
  }

  /**
   * 删除考场数据
   */
  public static async clearExamData(): Promise<void> {
    this.cachedExamData = null;
    this.cachedExamDigest = null;
    this.lastExamUpdateTime = NO_LOADING_MSG;
    await this.save();
  }

  /**
   * 删除自定义课程数据
   */
  public static async clearCustomData(): Promise<void> {
    this.cachedCustomData = null;
    this.cachedCustomDigest = null;
    await this.save();
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
   * @param type - 数据类型 0 = 课程数据，1 = 考试数据，2 = 自定义数据
   * @param digest - 数据摘要
   */
  public static async setDigest(type: number, digest: string): Promise<void> {
    switch (type) {
      case COURSE_TYPE:
        this.cachedDigest = digest;
        break;
      case EXAM_TYPE:
        this.cachedExamDigest = digest;
        break;
      case CUSTOM_TYPE:
        this.cachedCustomDigest = digest;
        break;
    }
    await this.save();
  }

  /**
   * 计算课程数据的摘要
   * @param data - 课程数据
   * @returns 数据摘要
   */
  public static calculateDigest(data: any): string {
    return objectHash(data);
  }

  /**
   * 计算摘要并和当前缓存的摘要进行比较
   * @param type - 课程类型
   * @param data - 课程数据
   * @returns 是否和当前缓存的数据一致
   */
  public static compareDigest(type: number, data: any): boolean {
    switch (type) {
      case COURSE_TYPE:
        return this.calculateDigest(data) === this.cachedDigest;
      case EXAM_TYPE:
        return this.calculateDigest(data) === this.cachedExamDigest;
      case CUSTOM_TYPE:
        return this.calculateDigest(data) === this.cachedCustomDigest;
      default:
        return false;
    }
  }

  /**
   * 类型谓词，用于判断是否为 CustomCourse 类型
   */
  public static isCustomCourse(course: CourseInfo): course is CustomCourse {
    return course.type === CUSTOM_TYPE;
  }

  /**
   * 手动为某门课程设置优先级（不含考试）
   * @param course - 课程信息
   */
  public static async setPriority(course: CourseInfo): Promise<void> {
    if (!this.cachedData) {
      return;
    }

    switch (course.type) {
      case COURSE_TYPE:
        const updatedData = Object.values(this.cachedData).map(day =>
          day.map(c => {
            if (c.id === course.id) {
              console.log(`Set priority for course ${course.name} to ${this.priorityCounter}`);
              this.priorityCounter = (this.priorityCounter + 1) % MAX_PRIORITY;
              return {
                ...c,
                priority: this.priorityCounter, // 设置优先级并自增计数器
              };
            }
            return c;
          }),
        );

        this.cachedData = updatedData;
        break;
      case CUSTOM_TYPE:
        if (!this.cachedCustomData) {
          console.log("cachedCustomData is null, this shouldn't happen");
          return;
        }
        const updatedCustomData = Object.values(this.cachedCustomData).map(day =>
          day.map(c => {
            if (this.isCustomCourse(course) && c.storageKey === course.storageKey) {
              console.log(`Set priority for custom course ${course.name} to ${this.priorityCounter}`);
              this.priorityCounter = (this.priorityCounter + 1) % MAX_PRIORITY;
              return {
                ...c,
                priority: this.priorityCounter, // 设置优先级并自增计数器
              };
            }
            return c;
          }),
        );

        this.cachedCustomData = updatedCustomData;
        break;
    }

    await this.save();
    // 调用 refresh 方法触发页面刷新
    this.refresh();
  }

  /**
   * 导入考场到课表中
   * @param exam - 考场数据
   * @param semesterStart
   * @param semesterEnd
   * @returns 导入成功数量
   */
  public static mergeExamCourses(exam: MergedExamData[], semesterStart: string, semesterEnd: string) {
    // 更新时间戳
    this.lastExamUpdateTime = new Date().toLocaleString();
    // 生成当前 tempData 的 digest
    const currentDigest = this.calculateDigest(exam);
    // 如果当前 digest 和上一次的 digest 一致，则不再进行后续处理
    if (currentDigest === this.cachedExamDigest && this.cachedExamData) return;

    let extendedCourses: ExtendCourse[] = [];
    const startDate = new Date(semesterStart); // 学期开始日期
    const endDate = new Date(semesterEnd); // 学期结束日期

    // 将 MergedExamData 转化为 ExtendCourse，优先级设置为最高
    for (const examItem of exam) {
      const { time, date } = examItem;
      if (!date) continue; // 如果没有日期，则不安排
      if (!time) continue; // 如果没有时间，则不安排
      if (date < startDate || date > endDate) continue; // 如果考试日期不在学期范围内，则不安排（这是为了规避补考）

      const weekday = date.getDay(); // 获取日期所在一周的第几天

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
          examType: '',
        };
        // 先将考试数据存储在 extendedCourses 中
        extendedCourses.push(course);
        console.log(`Merged exam course: ${course.name}`);
      } catch (error) {
        console.error('Failed to parse time range to:', error);
        continue;
      }
    }

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
    this.cachedExamData = groupedData;
    this.cachedExamDigest = currentDigest;
    this.save(); // 缓存数据
  }

  /**
   * 解析课程数据
   * @param courses - 原始课程数据
   * @returns 解析后的课程数据，事实上是将返回的原始数据进行了按 schedule展开。
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
   * @returns 按天归类的课程数据
   */
  public static setCourses(tempData: JwchCourseListResponse_Course[]): Record<number, ExtendCourse[]> {
    /* 缓存校对处理，如果缓存和传入的数据一致，不做任何改动 */

    // 更新时间戳
    this.lastCourseUpdateTime = new Date().toLocaleString();
    // 生成当前 tempData 的 digest
    const currentDigest = this.calculateDigest(tempData);
    // 如果当前 digest 和上一次的 digest 一致，则直接返回缓存的 data
    if (currentDigest === this.cachedDigest && this.cachedData) {
      return this.cachedData;
    }

    /* 到此处我们认为数据是不一致的，开始重新处理课程 */
    this.startID = DEFAULT_STARTID; // 初始化 id
    clearColorMapping(); // 清空颜色映射，重新分配颜色

    const schedules = this.parseCourses(tempData); // 解析课程数据

    // 为每个课程生成颜色并扩展数据
    const extendedCourses: ExtendCourse[] = schedules.map(schedule => {
      const id = this.allocateID(); // 分配一个新的 ID
      console.log('为课程' + schedule.name + '分配颜色: ' + courseColors[id % courseColors.length]);
      return {
        ...schedule,
        color: allocateColorForCourse(schedule.name), // 分配颜色
        priority: DEFAULT_PRIORITY, // 默认优先级
        id: id,
        type: COURSE_TYPE,
      };
    });

    // 为调课课程添加标记
    for (const course of extendedCourses) {
      if (course.adjust) {
        course.name = `[调课] ${course.name}`;
      }
    }

    // 按天归类课程数据
    const groupedData = extendedCourses.reduce(
      (result, current) => {
        const day = current.weekday - 1;
        result[day].push(current);
        return result;
      },
      Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, []])) as Record<number, ExtendCourse[]>,
    );

    // 更新缓存
    this.cachedDigest = currentDigest;
    this.cachedData = groupedData;

    this.save().then(() => this.refresh()); // 缓存数据

    return groupedData;
  }

  /**
   * 添加自定义课程，每次添加都会保存一次数据
   * @param course - 自定义课程
   */
  public static async addCustomCourse(course: CustomCourse) {
    if (!this.cachedCustomData) {
      this.cachedCustomData = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, []])) as Record<
        number,
        CustomCourse[]
      >;
    }

    const newIndex = course.weekday - 1;
    const newCourse: CustomCourse = {
      ...course,
      id: this.allocateID(),
      storageKey: randomUUID(),
      lastUpdateTime: new Date().toISOString(),
    };

    this.cachedCustomData[newIndex].push(newCourse);

    await this.save();
    this.refresh();
  }

  /**
   * 根据 key 获取自定义课程
   * @param key
   * @returns 课程数据
   */
  public static async getCustomCourse(key: string): Promise<CustomCourse | null> {
    if (!this.cachedCustomData) {
      return null;
    }

    for (const courses of Object.values(this.cachedCustomData)) {
      for (const course of courses) {
        if (course.storageKey === key) {
          return course;
        }
      }
    }

    return null;
  }

  /**
   * 更新自定义课程数据
   * @param course 课程数据
   */
  public static async updateCustomCourse(course: CustomCourse): Promise<void> {
    const key = course.storageKey;

    if (!this.cachedCustomData) {
      return;
    }

    const updatedCourse: CustomCourse = {
      ...course,
      lastUpdateTime: new Date().toISOString(),
    };

    // 先删除再添加
    for (const [day, courses] of Object.entries(this.cachedCustomData)) {
      this.cachedCustomData[+day] = courses.filter(c => c.storageKey !== key);
    }

    const newIndex = course.weekday - 1;
    this.cachedCustomData[newIndex].push(updatedCourse);

    await this.save();
    this.refresh();
  }

  /**
   * 删除自定义课程
   * @param key 指定的 key
   */
  public static async removeCustomCourse(key: string): Promise<void> {
    if (!this.cachedCustomData) {
      return;
    }

    for (const [day, courses] of Object.entries(this.cachedCustomData)) {
      this.cachedCustomData[+day] = courses.filter(course => course.storageKey !== key);
    }

    await this.save();
    this.refresh();
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

  // 特判两个情况：结束时间在 12:00 - 14:00 和 17:30 - 19:00 之间，此时 OVERTIME_THRESHOLD 会失效，使用 CLASS_BREAK_NOON 和 CLASS_BREAK_EVENING
  if (endTime >= CLASS_BREAK_NOON[0] && endTime <= CLASS_BREAK_NOON[1]) {
    endClass = 4; // 12:00 - 14:00 为午间休息
  } else if (endTime >= CLASS_BREAK_EVENING[0] && endTime <= CLASS_BREAK_EVENING[1]) {
    endClass = 8; // 17:30 - 19:00 为晚间休息
  }

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
  hiddenCoursesWithoutAttendances: false,
  calendarSubscribeUrl: '',
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
