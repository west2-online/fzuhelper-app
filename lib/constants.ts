// 服务端Token
export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// 本科生教务系统
export const JWCH_ID_KEY = 'jwch_id';
export const JWCH_COOKIES_KEY = 'jwch_cookies';
export const JWCH_USER_ID_KEY = 'jwch_user_id';
export const JWCH_USER_PASSWORD_KEY = 'jwch_user_password';
export const JWCH_USER_INFO_KEY = 'jwch_user_info';
export const JWCH_COOKIES_DOMAIN = 'https://jwcjwxt2.fzu.edu.cn:81';

// 一码通
export const YMT_ACCESS_TOKEN_KEY = 'ymt_access_token';
export const YMT_USERNAME_KEY = 'ymt_username'; // 姓名

// 隐私政策允许情况
export const IS_PRIVACY_POLICY_AGREED = 'is_privacy_policy_agreed';
export const URL_USER_AGREEMENT = 'https://fzuhelper.west2.online/onekey/UserAgreement.html';
export const URL_PRIVACY_POLICY = 'https://fzuhelper.west2.online/onekey/FZUHelper.html';

// 开屏页
export const SPLASH_DISPLAY_COUNT = 'splash_display_count';
export const SPLASH_DATE = 'splash_date';
export const SPLASH_ID = 'splash_id';

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
