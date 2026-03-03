import { createContext, useContext } from 'react';

import type { CourseSetting } from '@/api/interface';

interface CoursePageContextProps {
  setting: CourseSetting; // 课程表设置
}

const CoursePageContext = createContext<CoursePageContextProps | null>(null);

export const CoursePageProvider = CoursePageContext.Provider;

export function useCoursePageSetting(): CourseSetting {
  const context = useContext(CoursePageContext);

  if (!context) {
    throw new Error('useCoursePageSetting must be used within CoursePageProvider');
  }

  return context.setting;
}
