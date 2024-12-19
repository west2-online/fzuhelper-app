/* eslint-disable */
// @ts-ignore

export type deleteLaunchScreenApiImageParams = {
  /** 图片id */
  picture_id: number;
};

export type getApiV1CommonClassroomEmptyParams = {
  date?: string;
  campus?: string;
  startTime?: string;
  endTime?: string;
};

export type getApiV1InternalUserLoginParams = {
  /** 学号 */
  id: string;
  /** 密码 */
  password: string;
};

export type getApiV1JwchCourseListParams = {
  /** 学期 */
  term: string;
};

export type getLaunchScreenApiImageParams = {
  /** 图片id */
  picture_id: number;
};

export type getLaunchScreenApiImagePointParams = {
  /** 图片id */
  picture_id: number;
};

export type getLaunchScreenApiScreenParams = {
  /** 类型 */
  type: number;
  /** 学号 */
  student_id: string;
  /** 设备类型，android,ios 二选一，注意区分大小写 */
  device: number;
};

export type postLaunchScreenApiImageParams = {
  /** 1纯图片，2为页面url跳转，3为app的activity跳转 */
  pic_type: number;
  /** 开屏时长（秒） */
  duration: number;
  /** type字段的网址/uri */
  href: string;
  /** 开始推送的时间戳 */
  start_at: number;
  /** 结束推送的时间戳 */
  end_at: number;
  /** s_type,1为开屏页，2为轮播图，3为生日当天的开屏页 */
  s_type: number;
  /** 一天展示次数 */
  frequency: number;
  /** 比如6表示6点 */
  start_time: number;
  /** 比如24 这样就表示6-24点期间会推送该图片 */
  end_time: number;
  /** 开屏页点击区域/工具箱图片下方文字区域的文字 */
  text: string;
  /** 推送对象，通过正则里是否有学号来判断是否为推送目标，若学号为空，则向所有人推送 */
  regex: string;
};

export type putLaunchScreenApiImageImgParams = {
  /** 图片id */
  picture_id: number;
};

export type putLaunchScreenApiImageParams = {
  /** id */
  picture_id: number;
  /** 1为空，2为页面跳转，3为app跳转 */
  pic_type: number;
  /** 开屏时长（秒） */
  duration: number;
  /** type字段的网址/uri */
  href: string;
  /** 开始推送的时间戳 */
  start_at: number;
  /** 结束推送的时间戳 */
  end_at: number;
  /** s_type,1为开屏页，2为轮播图，3为生日当天的开屏页 */
  s_type: number;
  /** 一天展示次数 */
  frequency: number;
  /** 比如6表示6点 */
  start_time: number;
  /** 比如24 这样就表示6-24点期间会推送该图片 */
  end_time: number;
  /** 开屏页点击区域/工具箱图片下方文字区域的文字 */
  text: string;
  /** 推送对象，通过正则里是否有学号来判断是否为推送目标，若学号为空，则向所有人推送 */
  regex: string;
};
