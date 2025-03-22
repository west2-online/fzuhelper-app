export interface CourseSetting {
  selectedSemester: string; // 当前学期
  showNonCurrentWeekCourses: boolean; // 显示非本周课程
  exportExamToCourseTable: boolean; // 导出考试到课程表
  hiddenCoursesWithoutAttendances: boolean; // 隐藏免听的课程
  calendarExportEnabled: boolean; // 允许导出日历
  calendarSubscribeUrl: string; // 日历订阅地址
}

export interface LocateDateResult {
  date: string;
  week: number;
  day: number;
  semester: string;
}
