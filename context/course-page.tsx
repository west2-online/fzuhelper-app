import { createContext, useContext } from 'react';

import type { CourseSetting } from '@/api/interface';

interface CoursePageContextProps {
  setting: CourseSetting; // 课程表设置
}

// 此处这样写仅为了通过类型检查，实际使用时不可能为空
const CoursePageContext = createContext<CoursePageContextProps>({} as CoursePageContextProps);

export const CoursePageProvider = CoursePageContext.Provider;

export function useCoursePageSetting(): CourseSetting {
  const context = useContext(CoursePageContext);

  if (!context) {
    throw new Error('useCoursePageSetting must be used within CoursePageProvider');
  }

  return context.setting;
}
