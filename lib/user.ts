import AsyncStorage from '@react-native-async-storage/async-storage';

import { getApiV1LoginAccessToken } from '@/api/generate';
import { ACCESS_TOKEN_KEY, JWCH_USER_INFO_KEY, REFRESH_TOKEN_KEY } from '@/lib/constants';
import BuglyModule from '@/modules/bugly';
import { get } from '@/modules/native-request';
import { Buffer } from 'buffer';
import { LOCAL_USER_CREDENTIAL_KEY, LOCAL_USER_INFO_KEY } from './constants';
import UserLogin from './user-login';

// 本地用户信息
interface LocalUserInfo {
  type: string;
  userid: string;
  password: string;
}

// 本地登录凭证
interface LoginCredentials {
  identifier: string; // 本科生的身份识别用 id，研究生会设置为 5 个 0
  cookies: string; // 传递给教务系统的 Cookie Raw
}

interface SSOCredentials {
  cookies: string; // 传递给统一认证的 Cookie Raw
}

export const USER_TYPE_UNDERGRADUATE = 'undergraduate'; // 本科生
export const USER_TYPE_POSTGRADUATE = 'graduate'; // 研究生

// LocalUser 维护了本地的用户模型，这样可以同时兼容研究生和本科生
// 同时，通过这个 Class 屏蔽了页面中对于用户的直接操作（如登录和检查 Cookie），这样可以不必在页面中判断用户类型
// 具体的登录逻辑，我们放在的 @/lib/user-login.ts 中做
export class LocalUser {
  private static type: string; // 用户类型
  private static userid: string; // 学号
  private static password: string; // 密码
  private static identifier: string; // (仅本科生) 身份识别用 id，研究生会设置前导 0
  private static cookies: string; // 传递给教务系统的 Cookies
  private static loginObject = new UserLogin();
  public static isLoaded = false; // 是否已经加载过用户信息

  /**
   * 从 AsyncStorage 中加载用户信息和登录凭证
   */
  public static async load(): Promise<void> {
    const localUserInfo = await AsyncStorage.getItem(LOCAL_USER_INFO_KEY);
    const localCredentials = await AsyncStorage.getItem(LOCAL_USER_CREDENTIAL_KEY);
    if (localUserInfo) {
      const userInfo = JSON.parse(localUserInfo) as LocalUserInfo;
      this.type = userInfo.type;
      this.userid = userInfo.userid;
      this.password = userInfo.password;
    }
    if (localCredentials) {
      const credentials = JSON.parse(localCredentials) as LoginCredentials;
      this.identifier = credentials.identifier;
      this.cookies = credentials.cookies;
    }
    this.isLoaded = true;
  }

  /**
   * 清空用户信息，这个函数会同时清除 AsyncStorage 中的信息，包含 credentials
   */
  public static async clear(): Promise<void> {
    this.type = '';
    this.userid = '';
    this.password = '';
    this.identifier = '';
    this.cookies = '';
    this.isLoaded = false;
    await AsyncStorage.multiRemove([
      LOCAL_USER_INFO_KEY,
      LOCAL_USER_CREDENTIAL_KEY,
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      JWCH_USER_INFO_KEY,
    ]);
    await BuglyModule.setUserId('');
  }

  /**
   * 设置用户，该函数会调用 AsyncStorage 持久化存储
   * @param type 用户类型，可以使用 USER_TYPE_UNDERGRADUATE 或 USER_TYPE_GRADUATE 两个常量
   * @param username 登录的学号
   * @param password 登录的密码
   */
  public static async setUser(type: string, username: string, password: string): Promise<void> {
    if (!this.isLoaded) {
      await this.load();
    }
    this.type = type;
    this.userid = username;
    this.password = password;
    await AsyncStorage.setItem(
      LOCAL_USER_INFO_KEY,
      JSON.stringify({
        type: this.type,
        userid: this.userid,
        password: this.password,
      }),
    );
  }

  /**
   * 设置登录凭证
   * @param identifier 本科生的身份识别用 id，研究生留空会自动填充前缀
   * @param cookie 传递给教务系统的 Cookie
   */
  public static async setCredentials(identifier: string, cookie: string): Promise<void> {
    if (!this.isLoaded) {
      await this.load();
    }
    this.identifier = identifier;
    this.cookies = cookie;
    await AsyncStorage.setItem(
      LOCAL_USER_CREDENTIAL_KEY,
      JSON.stringify({
        identifier: this.identifier,
        cookies: this.cookies,
      }),
    );
  }

  /**
   * 获取用户信息
   * @returns 返回用户信息
   */
  public static getUser(): LocalUserInfo {
    return {
      type: this.type,
      userid: this.userid,
      password: this.password,
    };
  }

  /**
   * 获取登录凭证
   * @returns 返回登录凭证
   */
  public static getCredentials(): LoginCredentials {
    return {
      identifier: this.identifier,
      cookies: this.cookies,
    };
  }

  /**
   * 调用登录函数，会内部自动判断用户类型
   * @param captcha （可选）验证码，研究生完全不需要
   */
  public static async login(captcha?: string): Promise<void> {
    if (!this.isLoaded) {
      await this.load();
    }
    let newIdentifier: string = '';
    let newCookies: string = '';
    switch (this.type) {
      case USER_TYPE_UNDERGRADUATE:
        try {
          // 本科生登录
          const captchaImage = await this.loginObject.getCaptcha();
          const result = await this.loginObject.login(this.userid, this.password, captchaImage, false);
          newIdentifier = result.id;
          newCookies = result.cookies;
        } catch (err: any) {
          throw new Error(err);
        }
        break;
      case USER_TYPE_POSTGRADUATE:
        try {
          // 研究生登录
          const result = await this.loginObject.login(this.userid, this.password, '', true);
          newIdentifier = result.id;
          newCookies = result.cookies;
        } catch (err: any) {
          throw new Error(err);
        }
        break;
      default:
        return; // 不做任何事情，直接返回
    }

    // 通用逻辑，存储登录凭证并获取 AccessToken
    await this.setCredentials(newIdentifier, newCookies);
    try {
      await getApiV1LoginAccessToken();
      return Promise.resolve();
    } catch (e) {
      // accessToken 获取失败
      return Promise.reject(e);
    }
  }

  /**
   * 检查登录凭据是否过期
   * @returns 返回过期状态，失败或过期均返回 false
   */
  public static async checkCredentials(): Promise<boolean> {
    if (!this.isLoaded) {
      await this.load();
    }
    switch (this.type) {
      case USER_TYPE_UNDERGRADUATE:
        return await checkCookieJWCH({
          identifier: this.identifier,
          cookies: this.cookies,
        });
      case USER_TYPE_POSTGRADUATE:
        return await checkCookieYJSY({
          identifier: this.identifier,
          cookies: this.cookies,
        });
      default:
        break; // 不做任何事情
    }
    return false;
  }
}

// （本科生教务系统）检查 JWCH 的 Cookie 是否有效，如果无效，重新自动登录
async function checkCookieJWCH(credentials: LoginCredentials) {
  const COOKIE_CHECK_URL = 'https://jwcjwxt2.fzu.edu.cn:81/jcxx/xsxx/StudentInformation.aspx?id='; // 尝试访问学生个人信息页面
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

  const userid = (await LocalUser.getUser()).userid;
  if (!schoolid || !userid) {
    return false;
  }

  return (schoolid && userid && schoolid === userid) || false;
}

// （研究生教务系统）检查 JWCH 的 Cookie 是否有效，如果无效，重新自动登录
async function checkCookieYJSY(credentials: LoginCredentials) {
  const COOKIE_CHECK_URL = 'https://yjsglxt.fzu.edu.cn/xsgl/xsxx_show.aspx'; // 尝试访问学生个人信息页面
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

// （统一认证登录）检查 SSO 的 Cookie 是否有效，如果无效，重新自动登录
export async function checkCookieSSO(credentials: SSOCredentials) {
  const COOKIE_CHECK_URL = 'https://sso.fzu.edu.cn/login'; // 尝试访问学生个人信息页面
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
