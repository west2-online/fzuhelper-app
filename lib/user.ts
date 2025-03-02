import AsyncStorage from '@react-native-async-storage/async-storage';

import { checkCookieJWCH, userLogin } from '@/utils/user';
import { LOCAL_USER_CREDENTIAL_KEY, LOCAL_USER_INFO_KEY } from './constants';

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

export const USER_TYPE_UNDERGRADUATE = 'undergraduate'; // 本科生
export const USER_TYPE_POSTGRADUATE = 'graduate'; // 研究生

// LocalUser 维护了本地的用户模型，这样可以同时兼容研究生和本科生
// 同时，通过这个 Class 屏蔽了页面中对于用户的直接操作（如登录和检查 Cookie），这样可以不必在页面中判断用户类型
export class LocalUser {
  private static type: string; // 用户类型
  private static userid: string; // 学号
  private static password: string; // 密码

  private static identifier: string; // (仅本科生) 身份识别用 id，研究生不需要
  private static cookies: string; // 传递给教务系统的 Cookies

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
  }

  /**
   * 清空用户信息，这个函数会同时清除 AsyncStorage 中的信息，包含 crenditails
   */
  public static async clear(): Promise<void> {
    this.type = '';
    this.userid = '';
    this.password = '';
    this.identifier = '';
    this.cookies = '';
    await AsyncStorage.multiRemove([LOCAL_USER_INFO_KEY, LOCAL_USER_CREDENTIAL_KEY]);
  }

  /**
   * 设置用户，该函数会调用 AsyncStorage 持久化存储
   * @param type 用户类型，可以使用 USER_TYPE_UNDERGRADUATE 或 USRE_TYPE_GRADUATE 两个常量
   * @param username 登录的学号
   * @param password 登录的密码
   */
  public static async setUser(type: string, username: string, password: string): Promise<void> {
    this.type = type;
    this.userid = username;
    this.password = password;
    await AsyncStorage.setItem(
      LOCAL_USER_INFO_KEY,
      JSON.stringify({
        type: this.type,
        username: this.userid,
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
    switch (this.type) {
      case USER_TYPE_UNDERGRADUATE:
        // 本科生登录
        try {
          await userLogin({
            id: this.userid,
            password: this.password,
          });
        } catch (err: any) {
          throw new Error(err);
        }
        break;
      case USER_TYPE_POSTGRADUATE:
        // 研究生登录
        break;
      default:
        break; // 不做任何事情
    }
  }

  /**
   * 检查登录凭据是否过期
   * @returns 返回过期状态，失败或过期均返回 false
   */
  public static async checkCredentials(): Promise<boolean> {
    switch (this.type) {
      case USER_TYPE_UNDERGRADUATE:
        return await checkCookieJWCH();
      case USER_TYPE_POSTGRADUATE:
        // 研究生登录
        break;
      default:
        break; // 不做任何事情
    }
    return false;
  }
}
