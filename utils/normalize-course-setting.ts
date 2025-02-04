import type { CourseSetting } from '@/api/interface';

const defaultCourseSetting: CourseSetting = {
  selectedSemester: '',
  calendarExportEnabled: false,
  showNonCurrentWeekCourses: false,
  autoImportAdjustmentEnabled: false,
};

// 本质是将传入的 courseSetting 与 defaultCourseSetting 合并
const normalizeCourseSetting = (courseSetting: Partial<CourseSetting>) => {
  return { ...defaultCourseSetting, ...courseSetting } as CourseSetting;
};

export default normalizeCourseSetting;
