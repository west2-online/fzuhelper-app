import AsyncStorage from '@react-native-async-storage/async-storage';

import { RejectEnum } from '@/api/enum';
import { getApiV1LoginAccessToken } from '@/api/generate';
import { queryClient } from '@/components/query-provider';
import {
  ACCESS_TOKEN_KEY,
  COURSE_SETTINGS_KEY,
  EMPTY_ROOM_SELECTED_CAMPUS_KEY,
  REFRESH_TOKEN_KEY,
} from '@/lib/constants';
import { get } from '@/modules/native-request';
import { Buffer } from 'buffer';
import { LOCAL_USER_CREDENTIAL_KEY, LOCAL_USER_INFO_KEY } from './constants';
import { CourseCache } from './course';
import UserLogin from './user-login';
import {
  clearUserState,
  getCredentials,
  getUserInfo,
  getUserState,
  setUserState,
  type LoginCredentials,
  type UserInfo,
} from './user-store';

export const USER_TYPE_UNDERGRADUATE = 'undergraduate'; // 本科生
export const USER_TYPE_POSTGRADUATE = 'graduate'; // 研究生

// ── 登录对象（模块级单例）───────────────────────────────

const loginObject = new UserLogin();

// ── 持久化辅助函数 ──────────────────────────────────────

/** 将用户信息持久化到 AsyncStorage，同时更新 store */
async function persistUserInfo(info: UserInfo): Promise<void> {
  setUserState({
    type: info.type,
    userid: info.userid,
    password: info.password,
  });
  await AsyncStorage.setItem(
    LOCAL_USER_INFO_KEY,
    JSON.stringify({
      type: info.type,
      userid: info.userid,
      password: info.password,
    }),
  );
}

/** 将登录凭据持久化到 AsyncStorage，同时更新 store */
async function persistCredentials(credentials: LoginCredentials): Promise<void> {
  setUserState({
    identifier: credentials.identifier,
    cookies: credentials.cookies,
  });
  await AsyncStorage.setItem(
    LOCAL_USER_CREDENTIAL_KEY,
    JSON.stringify({
      identifier: credentials.identifier,
      cookies: credentials.cookies,
    }),
  );
}

// ── 从 AsyncStorage 加载 ────────────────────────────────

/** 从 AsyncStorage 加载用户信息和凭据到内存 store */
export async function loadUser(): Promise<void> {
  const localUserInfo = await AsyncStorage.getItem(LOCAL_USER_INFO_KEY);
  const localCredentials = await AsyncStorage.getItem(LOCAL_USER_CREDENTIAL_KEY);
  if (localUserInfo) {
    const userInfo = JSON.parse(localUserInfo) as UserInfo;
    setUserState({
      type: userInfo.type,
      userid: userInfo.userid,
      password: userInfo.password,
    });
  }
  if (localCredentials) {
    const credentials = JSON.parse(localCredentials) as LoginCredentials;
    setUserState({
      identifier: credentials.identifier,
      cookies: credentials.cookies,
    });
  }
  setUserState({ isLoaded: true });
}

// ── 公开操作函数 ────────────────────────────────────────

/**
 * 设置用户基本信息并持久化
 * @param type 用户类型 (undergraduate / graduate)
 * @param username 学号
 * @param password 密码
 */
export async function setUser(type: string, username: string, password: string): Promise<void> {
  if (!getUserState().isLoaded) {
    await loadUser();
  }
  await persistUserInfo({ type, userid: username, password });
}

/**
 * 设置登录凭据并持久化
 * @param identifier 本科生身份识别 id，研究生留空会自动填充前缀
 * @param cookies 传递给教务系统的 Cookie
 */
export async function setCredentials(identifier: string, cookies: string): Promise<void> {
  if (!getUserState().isLoaded) {
    await loadUser();
  }
  await persistCredentials({ identifier, cookies });
}

/** 获取验证码（仅本科生教务系统需要） */
export function getCaptcha(): Promise<Uint8Array> {
  return loginObject.getCaptcha();
}

/**
 * 执行登录流程，自动判断用户类型
 * @param captcha （可选）验证码，研究生不需要
 */
export async function performLogin(captcha?: string): Promise<void> {
  const state = getUserState();
  if (!state.isLoaded) {
    await loadUser();
  }

  const { userid, password, type } = getUserInfo();

  const result = await loginObject.login(userid, password, captcha, type === USER_TYPE_POSTGRADUATE);

  // 存储登录凭据
  await persistCredentials({ identifier: result.id, cookies: result.cookies });
  await checkCredentialsAndThrow();

  try {
    await getApiV1LoginAccessToken();
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * 检查登录凭据是否过期/串号
 * @returns 凭据是否有效
 */
export async function checkCredentials(): Promise<boolean> {
  const state = getUserState();
  if (!state.isLoaded) {
    await loadUser();
  }
  const { type } = getUserInfo();
  const credentials = getCredentials();

  switch (type) {
    case USER_TYPE_UNDERGRADUATE:
      return await checkCookieJWCH(credentials);
    case USER_TYPE_POSTGRADUATE:
      return await checkCookieYJSY(credentials);
    default:
      break;
  }
  return false;
}

/**
 * 检查登录凭据是否过期/串号，失败时抛出异常
 */
export async function checkCredentialsAndThrow(): Promise<void> {
  if (!(await checkCredentials())) {
    return Promise.reject({
      type: RejectEnum.NativeLoginFailed,
      data: '登录数据异常，请重试',
    });
  }
}

/** 清空用户信息和凭据 */
export async function clearUser(): Promise<void> {
  clearUserState();
  loginObject.clearCookies();
  await AsyncStorage.multiRemove([LOCAL_USER_INFO_KEY, LOCAL_USER_CREDENTIAL_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

/** 完整的退出登录流程（清除课程缓存、用户数据、网络缓存等） */
export async function logoutUser(): Promise<void> {
  await CourseCache.clear();
  await clearUser();
  queryClient.clear();
  await AsyncStorage.multiRemove([COURSE_SETTINGS_KEY, EMPTY_ROOM_SELECTED_CAMPUS_KEY]);
}

// ── Cookie 检查函数（纯函数）────────────────────────────

interface SSOCredentials {
  cookies: string;
}

// （本科生教务系统）检查 JWCH 的 Cookie 是否有效，检查串号
async function checkCookieJWCH(credentials: LoginCredentials) {
  const COOKIE_CHECK_URL = 'https://jwcjwxt2.fzu.edu.cn:81/jcxx/xsxx/StudentInformation.aspx?id=';
  if (!credentials.identifier || !credentials.cookies) {
    return false;
  }
  const resp = await get(COOKIE_CHECK_URL + credentials.identifier, {
    Referer: 'https://jwch.fzu.edu.cn',
    ORIGIN: 'https://jwch.fzu.edu.cn',
    'X-Requested-With': 'XMLHttpRequest',
    Cookie: credentials.cookies,
  });

  const str = Buffer.from(resp.data).toString('utf-8').replace(/\s+/g, '');
  const schoolid = /id="ContentPlaceHolder1_LB_xh">(\d+)/.exec(str)?.[1];

  const { userid } = getUserInfo();
  console.log('checkCookieJWCH: from info page: ', schoolid, 'from user input: ', userid);
  if (!schoolid || !userid) {
    return false;
  }

  return (schoolid && userid && schoolid === userid) || false;
}

// （研究生教务系统）检查 YJSY 的 Cookie 是否有效
async function checkCookieYJSY(credentials: LoginCredentials) {
  const COOKIE_CHECK_URL = 'https://yjsglxt.fzu.edu.cn/xsgl/xsxx_show.aspx';
  if (!credentials.cookies) {
    return false;
  }
  const resp = await get(COOKIE_CHECK_URL, {
    REFERER: 'https://yjsy.fzu.edu.cn',
    Cookie: credentials.cookies,
  });
  const decodedText = Buffer.from(resp.data).toString('utf-8');
  if (decodedText.includes('当前登录用户已过期') || decodedText.includes('系统错误')) {
    return false;
  }

  return true;
}

// （统一认证登录）检查 SSO 的 Cookie 是否有效
export async function checkCookieSSO(credentials: SSOCredentials) {
  const COOKIE_CHECK_URL = 'https://sso.fzu.edu.cn/login';
  if (!credentials.cookies) {
    return false;
  }
  const resp = await get(COOKIE_CHECK_URL, {
    REFERER: 'https://sso.fzu.edu.cn',
    Cookie: credentials.cookies,
  });
  if (resp.status === 200) {
    return false;
  }

  return true;
}
