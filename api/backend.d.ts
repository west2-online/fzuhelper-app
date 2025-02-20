import {
  getApiV1JwchAcademicCredit,
  getApiV1JwchAcademicGpa,
  getApiV1JwchClassroomExam,
  getApiV1JwchCourseList,
  getApiV1TermsList,
} from '@/api/generate';

// 推断异步函数返回值类型的类型体操
export type AsyncReturnType<
  T extends (...args: any) => Promise<any>, // 泛型参数 T 为一个返回 Promise 类型的函数
> = T extends (...args: any) => Promise<infer R> ? R : any; // 利用条件类型和 `infer` 关键字提取出函数返回值所包裹的实际类型 R

/*
请在下方编写接口返回值类型推导定义，格式参照已有定义
====================
1. 注意命名规范，接口名应为函数名去掉 getApiV1 前缀，首字母大写，后加 Response。如：getApiV1TermsList -> TermsListResponse。
2. 注意类型推导的准确性，应与接口返回值保持一致。
3. 注意子类型的定义，如 getApiV1JwchCourseList 接口返回的 course[0].scheduleRule[0] 应命名为 JwchCourseListResponse_CourseScheduleRule。
4. 第一个 data 指的是响应 HTTP 的 data 字段，第二个 data 指的是响应数据的 data 字段。
*/

// === 通用 ===

// getApiV1TermsList
export type TermsListResponse = AsyncReturnType<typeof getApiV1TermsList>['data']['data'];
export type TermsListResponse_Terms = TermsListResponse['terms']; // 学期列表
export type TermsListResponse_Term = TermsListResponse_Terms[0]; // 默认的第一个学期

// === 课表 ===

// getApiV1JwchCourseList
export type JwchCourseListResponse = AsyncReturnType<typeof getApiV1JwchCourseList>['data']['data'];
export type JwchCourseListResponse_Course = JwchCourseListResponse[0];
export type JwchCourseListResponse_CourseScheduleRules = JwchCourseListResponse_Course['scheduleRules'];
export type JwchCourseListResponse_CourseScheduleRule = JwchCourseListResponse_CourseScheduleRules[0];

// === 学业 ===

// getApiV1JwchAcademicGpa
export type JwchAcademicGpaResponse = AsyncReturnType<typeof getApiV1JwchAcademicGpa>['data']['data'];
export type JwchAcademicGpaResponse_AcademicGpaData = JwchAcademicGpaResponse['data'];
export type JwchAcademicGpaResponse_AcademicGpaDataItem = JwchAcademicGpaResponse_AcademicGpaData['data'][0];

// getApiV1JwchAcademicCredit
export type JwchAcademicCreditResponse = AsyncReturnType<typeof getApiV1JwchAcademicCredit>['data']['data'];
export type JwchAcademicCreditResponse_AcademicCreditData = JwchAcademicCreditResponse[0];

// === 教室 ===

// getApiV1JwchClassroomExam
export type JwchClassroomExamResponse = AsyncReturnType<typeof getApiV1JwchClassroomExam>['data']['data'];
export type JwchClassroomExamResponse_ClassroomExam = JwchClassroomExamResponse[0];
