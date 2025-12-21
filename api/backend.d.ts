import {
  type getApiV1CommonClassroomEmpty,
  type getApiV1CommonContributor,
  type getApiV1JwchAcademicGpa,
  type getApiV1JwchAcademicPlan,
  type getApiV1JwchAcademicScores,
  type getApiV1JwchAcademicUnifiedExam,
  type getApiV1JwchClassroomExam,
  type getApiV1JwchCourseList,
  type getApiV1LaunchScreenScreen,
  type getApiV1TermsInfo,
  type getApiV1TermsList,
  type getApiV1UserFriendList,
  type getApiV2JwchAcademicCredit,
  type getApiV2VersionAndroid,
} from '@/api/generate';

import { AsyncReturnType } from '@/types/utils';

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
export type TermsListResponse_Term = TermsListResponse_Terms[0]; // 列表中的元素（一个学期）

// getApiV1CommonContributor
export type CommonContributorResponse = AsyncReturnType<typeof getApiV1CommonContributor>['data']['data'];
export type CommonContributorResponse_Contributors = CommonContributorResponse['fzuhelper_app'];
export type CommonContributorResponse_Contributor = CommonContributorResponse_Contributors[0];

// getApiV1TermsInfo
export type TermsInfoResponse = AsyncReturnType<typeof getApiV1TermsInfo>['data']['data'];
export type TermsInfoResponse_Events = TermsInfoResponse['events'];
export type TermsInfoResponse_Event = TermsInfoResponse_Events[0];

// === 课表 ===

// getApiV1JwchCourseList
export type JwchCourseListResponse = AsyncReturnType<typeof getApiV1JwchCourseList>['data']['data'];
export type JwchCourseListResponse_Course = JwchCourseListResponse[0];
export type JwchCourseListResponse_CourseScheduleRules = JwchCourseListResponse_Course['scheduleRules'];
export type JwchCourseListResponse_CourseScheduleRule = JwchCourseListResponse_CourseScheduleRules[0];

// === 学业 ===
// getApiV1JwchAcademicScores
export type JwchAcademicScoresResponse = AsyncReturnType<typeof getApiV1JwchAcademicScores>['data'];
export type JwchAcademicScoresResponse_AcademicScoresData = JwchAcademicScoresResponse['data'];
export type JwchAcademicScoresResponse_AcademicScoresDataItem = JwchAcademicScoresResponse_AcademicScoresData[0];

// getApiV1JwchAcademicGpa
export type JwchAcademicGpaResponse = AsyncReturnType<typeof getApiV1JwchAcademicGpa>['data']['data'];
export type JwchAcademicGpaResponse_AcademicGpaData = JwchAcademicGpaResponse['data'];
export type JwchAcademicGpaResponse_AcademicGpaDataItem = JwchAcademicGpaResponse_AcademicGpaData['data'][0];

// getApiV2JwchAcademicCredit
export type JwchAcademicCreditV2Response = AsyncReturnType<typeof getApiV2JwchAcademicCredit>['data']['data'];
export type JwchAcademicCreditV2Response_Type = JwchAcademicCreditV2Response[0];
export type JwchAcademicCreditV2Response_TypeData = JwchAcademicCreditV2Response_Type['data'];
export type JwchAcademicCreditV2Response_TypeDataItem = JwchAcademicCreditV2Response_TypeData[0];

// getApiV1JwchAcademicUnifiedExam
export type JwchAcademicUnifiedExamResponse = AsyncReturnType<typeof getApiV1JwchAcademicUnifiedExam>['data']['data'];
export type JwchAcademicUnifiedExamResponse_UnifiedExamData = JwchAcademicUnifiedExamResponse[0];

// getApiV1JwchAcademicPlan
export type JwchAcademicPlanResponse = AsyncReturnType<typeof getApiV1JwchAcademicPlan>['data']['data'];

// === 教室 ===

// getApiV1JwchClassroomExam
export type JwchClassroomExamResponse = AsyncReturnType<typeof getApiV1JwchClassroomExam>['data']['data'];
export type JwchClassroomExamResponse_ClassroomExam = JwchClassroomExamResponse[0];

// === 空教室 ===
export type CommonClassroomEmptyResponse = AsyncReturnType<typeof getApiV1CommonClassroomEmpty>['data']['data'];
export type CommonClassroomEmptyResponse_Classroom = CommonClassroomEmptyResponse[0];

// === 安卓更新检测 ===
// getApiV2VersionAndroid
export type VersionAndroidResponse = AsyncReturnType<typeof getApiV2VersionAndroid>['data']['data'];
export type VersionAndroidResponse_Data = VersionAndroidResponse['release'];

// === 开屏页 ===
// getApiV1LaunchScreenScreen
export type LaunchScreenScreenResponse = AsyncReturnType<typeof getApiV1LaunchScreenScreen>['data']['data'];
export type LaunchScreenScreenResponse_Screen = LaunchScreenScreenResponse[0];

// === 好友 ===
// getApiV1UserFriendList
export type UserFriendListResponse = AsyncReturnType<typeof getApiV1UserFriendList>['data']['data'];
export type UserFriendListResponse_Friend = UserFriendListResponse[0];
