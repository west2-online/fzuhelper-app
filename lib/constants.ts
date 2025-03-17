/**
 * @description 此文件中包含各种常量的定义。
 *
 * - 对于 AsyncStorage 的 key，请以大写字母和下划线分隔，以 _KEY 结尾。
 * - 对于事件名称，请以 EVENT_ 开头。
 * - 对于本科生教学管理系统和研究生信息管理系统的 key，请分别以 JWCH_ / YJSY_ 开头。
 * - 对于单独业务的 key，请以业务名称简写开头，并在同一业务内保持统一。
 */

// 服务端Token
export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// 推送管理
export const ALLOW_PUSH_EVENT_KEYS = 'allow_push_event';
export const UMENG_JWCH_PUSH_TAG = 'jwch-notice'; // 友盟教务处通知 Tag

// 用户模型
export const LOCAL_USER_INFO_KEY = 'local_user_info'; // 本地用户信息
export const LOCAL_USER_CREDENTIAL_KEY = 'local_user_credential'; // 本地用户凭证

// 本科生教务系统
// 以 JWCH_ 开头
export const JWCH_USER_INFO_KEY = 'jwch_user_info'; // 用户信息
export const JWCH_COOKIES_DOMAIN = 'https://jwcjwxt2.fzu.edu.cn:81'; // JWCH Cookies 域名
export const JWCH_LOCATE_DATE_URL = 'https://jwcjwxt2.fzu.edu.cn:82/week.asp'; // JWCH 定位日期 URL
export const JWCH_LOCATE_DATE_CACHE_KEY = 'jwch_locate_date'; // JWCH 定位日期缓存 Key
export const JWCH_CURRENT_SEMESTER_KEY = 'jwch_current_semester'; // 当前学期信息

// 研究生教务系统
// 以 YJSY_ 开头
export const YJSY_COOKIES_DOMAIN = 'https://yjsglxt.fzu.edu.cn'; // YJSY Cookies 域名

// 一码通
// 以 YMT_ 开头
export const YMT_ACCESS_TOKEN_KEY = 'ymt_access_token';
export const YMT_USERNAME_KEY = 'ymt_username'; // 姓名

// SSO 登录
export const SSO_LOGIN_URL = 'https://sso.fzu.edu.cn/login';
export const SSO_LOGIN_COOKIE_KEY = 'sso_login_cookie';
export const SSO_LOGIN_COOKIE_DOMAIN = 'https://sso.fzu.edu.cn';

// 学习空间预约
export const LEARNING_CENTER_TOKEN_KEY = 'learning_center_token';

// 隐私政策允许情况
export const IS_PRIVACY_POLICY_AGREED = 'is_privacy_policy_agreed';
export const URL_USER_AGREEMENT = 'https://fzuhelper.west2.online/onekey/UserAgreement.html';
export const URL_PRIVACY_POLICY = 'https://fzuhelper.west2.online/onekey/FZUHelper.html';

// 开屏页
export const SPLASH_DISPLAY_COUNT = 'splash_display_count';
export const SPLASH_DATE = 'splash_date';
export const SPLASH_ID = 'splash_id';

// 课程表
export const COURSE_CURRENT_CACHE_KEY = 'course_current_cache';
export const COURSE_SETTINGS_KEY = 'course_settings';
export const COURSE_DATA_KEY = 'course_data';
export const COURSE_LOCAL_CALENDAR_ID_KEY = 'course_local_calendar_id';
export const COURSE_TERMS_LIST_KEY = 'course_terms_list';
export const CLASS_SCHEDULES = [
  ['08:20', '09:05'],
  ['09:15', '10:00'],
  ['10:20', '11:05'],
  ['11:15', '12:00'],
  ['14:00', '14:45'],
  ['14:55', '15:40'],
  ['15:50', '16:35'],
  ['16:45', '17:30'],
  ['19:00', '19:45'],
  ['19:55', '20:40'],
  ['20:50', '21:35'],
];
export const CLASS_SCHEDULES_MINUTES = [
  [500, 545],
  [555, 600],
  [620, 665],
  [675, 720],
  [840, 885],
  [895, 940],
  [950, 995],
  [1005, 1050],
  [1140, 1185],
  [1195, 1240],
  [1250, 1295],
];
export const CLASS_BREAK_NOON = [720, 840]; // 12:00 - 14:00
export const CLASS_BREAK_EVENING = [1050, 1140]; // 17:30 - 19:00

// 考场
export const EXAM_ROOM_KEY = 'exam_room';

// 成绩
export const GRADE_LIST_KEY = 'grade_list';

// 历年卷
export const PAPER_SEARCH_HISTORY_KEY = 'paper_search_history';

// 成绩颜色对照
export const GRADE_COLOR_EXCELLENT = '#9310FF'; // >90 优秀
export const GRADE_COLOR_GOOD = '#1089FF'; // 80-89 良好
export const GRADE_COLOR_MEDIUM = '#10CEFF'; // 70-79 中等
export const GRADE_COLOR_PASS = '#FFA710'; // 60-69 及格
export const GRADE_COLOR_FAIL = '#FF0000'; // <60 不及格
export const GRADE_COLOR_UNKNOWN = '#BBBBBB'; // 成绩未录入 缺考

// 课程类型映射，目前适用于考场查询
export const COURSE_SYMBOLS_MAP = {
  '▲': '[补考]',
  '●': '[重修]',
  '★': '[二专业]',
} as const;

// for RNR
// please sync it with values in `global.css`
export const NAV_THEME = {
  light: {
    background: 'hsl(0 0% 100%)', // background
    border: 'hsl(240 5.9% 90%)', // border
    card: 'hsl(0 0% 100%)', // card
    notification: 'hsl(0 84.2% 60.2%)', // destructive
    primary: 'hsl(240 5.9% 10%)', // primary
    text: 'hsl(240 10% 3.9%)', // foreground
  },
  dark: {
    background: 'hsl(240 10% 3.9%)', // background
    border: 'hsl(240 3.7% 15.9%)', // border
    card: 'hsl(240 10% 3.9%)', // card
    notification: 'hsl(0 72% 51%)', // destructive
    primary: 'hsl(0 0% 98%)', // primary
    text: 'hsl(0 0% 98%)', // foreground
  },
};

export const EXPIRE_ONE_DAY = 1000 * 60 * 60 * 24; // 一天的毫秒数

export const IOS_APP_GROUP = 'group.FzuHelper.NextCourse'; // iOS App Group，需要保持和 app.config.ts 中的一致

// 日期时间格式化
export const DATE_FORMAT = 'YYYY/M/D';
export const TIME_FORMAT = 'HH:mm';
export const TIME_SECOND_FORMAT = `${TIME_FORMAT}:ss`;
export const DATETIME_FORMAT = `${DATE_FORMAT} ${TIME_FORMAT}`;
export const DATETIME_SECOND_FORMAT = `${DATE_FORMAT} ${TIME_SECOND_FORMAT}`;

// 发布通道
export const RELEASE_CHANNEL_KEY = 'release_channel';
