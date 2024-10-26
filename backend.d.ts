export interface GetCourseListResponse {
  code: string;
  data: Course[];
  message: string;
}

export interface Course {
  /**
   * 授课计划地址
   */
  lessonplan: string;
  /**
   * 课程名
   */
  name: string;
  rawAdjust: string;
  rawScheduleRules: string;
  /**
   * 备注
   */
  remark: string;
  /**
   * 课程安排
   */
  scheduleRules: CourseScheduleRule[];
  /**
   * 教学大纲地址
   */
  syllabus: string;
  /**
   * 老师
   */
  teacher: string;
}

export interface CourseScheduleRule {
  /**
   * 调课
   */
  adjust: boolean;
  /**
   * 双周
   */
  double: boolean;
  /**
   * 结束节次
   */
  endClass: number;
  /**
   * 结束周数
   */
  endWeek: number;
  /**
   * 上课地点
   */
  location: string;
  /**
   * 单周
   */
  single: boolean;
  /**
   * 开始节次
   */
  startClass: number;
  /**
   * 起始周数
   */
  startWeek: number;
  /**
   * 周几
   */
  weekday: number;
}
