export interface CourseSetting {
  selectedSemester: string;
  calendarExportEnabled: boolean;
  showNonCurrentWeekCourses: boolean;
  exportExamToCourseTable: boolean;
  hiddenCoursesWithoutAttendances: boolean;
}

export interface LocateDateResult {
  date: string;
  week: number;
  day: number;
  semester: string;
}
