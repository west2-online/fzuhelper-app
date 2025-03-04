/* eslint-disable */
// @ts-ignore

export type getApiV1CommonClassroomEmptyParams = {
  date?: string;
  campus?: string;
  startTime?: string;
  endTime?: string;
};

export type getApiV1JwchClassroomExamParams = {
  /** 学期 202401 */
  term?: string;
};

export type getApiV1JwchCourseListParams = {
  /** 学期 */
  term: string;
  /** 强刷标签 */
  is_refresh: boolean;
};

export type getApiV1LaunchScreenImagePointTimeParams = {
  /** 图片id */
  picture_id: number;
};

export type getApiV1LaunchScreenScreenParams = {
  /** 类型 */
  type: number;
  /** 学号 */
  student_id: string;
  /** 设备类型，android,ios 二选一，注意区分大小写 */
  device: string;
};

export type getApiV1PaperDownloadParams = {
  filepath?: string;
};

export type getApiV1PaperListParams = {
  path?: string;
};

export type getApiV1TermsInfoParams = {
  term?: string;
};
