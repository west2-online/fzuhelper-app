import dayjs from 'dayjs';

// 课程成绩数据
export interface CourseGradesData  {
  name: string; // 课程名
  teacher: string; // 授课教师
  credit: string; // 学分（有 0 学分的课）
  score: string; // 成绩（没有录入成绩会显示‘成绩尚未录入’，5 级制和两级制度会显示中文）
  gpa: string; // 绩点（注意这个可能是空的）
  term: string; // 学期(e.g. 202402)
  exam_type: string; // 考试类型(e.g. 正常考考试、第1次重修、正常考考试补考)
  elective_type: string; // 选修类型(e.g. 通识必修、实践必修、毕业实习、学科必修、专业选修、人文社会科学类)
};

// 学期总结
export interface SemesterSummary {
  totalCredit: number; // 本学期总修学分
  totalCount: number; // 本学期总课程数
  maxScore: number; // 单科最高分
  GPA: number; // GPA
};

// 考场数据
export interface MergedExamData  {
  name: string; // 课程名
  credit: string; // 学分
  teacher: string; // 授课教师
  date?: dayjs; // 考试日期
  location?: string; // 考场位置
  time?: string; // 考试时间
  isFinished: boolean; // 是否已经结束
};
export interface ParsedCourse extends Omit<JwchCourseListResponse_Course, 'rawAdjust' | 'rawScheduleRules' | 'scheduleRules'> ,
  JwchCourseListResponse_CourseScheduleRule{}

// 对课程类型的拓展，支持颜色等设计，也允许后期进行不断扩充
interface ExtendCourseBase extends ParsedCourse {
  id: number; // 我们为每门课程分配一个唯一的 ID，后续可以用于识别
  color: string; // 课程颜色
  priority: number; // 优先级
}

export interface ExtendCourse extends ExtendCourseBase  {
  type: 0 | 1 | 2; // 课程类型（0 = 普通课程，1 = 考试，2 = 自定义课程）
};

export interface CustomCourse extends ExtendCourseBase  {
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
