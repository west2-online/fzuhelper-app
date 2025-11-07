import { createContext } from 'react';

import type { TermsListResponse_Term } from '@/api/backend';
import type { CourseSetting } from '@/api/interface';
import type { CourseInfo } from '@/lib/course';

export interface CoursePageContextProps {
  setting: CourseSetting; // 课程表设置
  currentWeek: number; // 今天在选中学期的周数，如果今天不在选中学期内则为-1
  currentTerm: TermsListResponse_Term; // 当前选中学期基本信息
  maxWeek: number; // 当前选中学期的最大周数
  schedulesByDays: Record<number, CourseInfo[]>; // 课表数据（按天归类）
  refetch: () => Promise<void>; // 刷新数据的函数
}

// 此处这样写仅为了通过类型检查，实际使用时不可能为空
export const CoursePageContext = createContext<CoursePageContextProps>({} as CoursePageContextProps);

export const CoursePageProvider = CoursePageContext.Provider;
