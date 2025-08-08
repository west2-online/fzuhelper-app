import { TermsListResponse_Term } from '@/api/backend';
import { CourseSetting } from '@/api/interface';
import { createContext } from 'react';

export interface CoursePageContextProps {
  setting: CourseSetting; // 课程表设置
  currentWeek: number; // 今天在选中学期的周数，如果今天不在选中学期内则为-1
  currentTerm: TermsListResponse_Term; // 当前选中学期基本信息
  maxWeek: number; // 当前选中学期的最大周数
}

// 此处这样写仅为了通过类型检查，实际使用时不可能为空
export const CoursePageContext = createContext<CoursePageContextProps>({} as CoursePageContextProps);
