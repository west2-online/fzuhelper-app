/* eslint-disable */
// @ts-ignore

export interface getApiV1CommonClassroomEmptyParams {
  date?: string;
  campus?: string;
  startTime?: string;
  endTime?: string;
};

export interface getApiV1CourseCalendarSubscribeParams {
  token?: string;
};

export interface getApiV1JwchClassroomExamParams {
  /** 学期 202401(研究生2023-2024-2) */
  term?: string;
};

export interface getApiV1JwchCourseListParams {
  /** 学期 */
  term: string;
  /** 强刷标签 */
  is_refresh: boolean;
};

export interface getApiV1LaunchScreenImagePointTimeParams {
  /** 图片id */
  picture_id: number;
};

export interface getApiV1LaunchScreenScreenParams {
  /** 类型 */
  type: number;
  /** 学号 */
  student_id: string;
  /** 设备类型，android,ios 二选一，注意区分大小写 */
  device: string;
};

export interface getApiV1PaperDownloadParams {
  filepath?: string;
};

export interface getApiV1PaperListParams {
  path?: string;
};

export interface getApiV1TermsInfoParams {
  term?: string;
};
