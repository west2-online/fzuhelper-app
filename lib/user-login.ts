import { RejectEnum } from '@/api/enum';
import { ACCESS_TOKEN_KEY, JWCH_COOKIES_KEY, JWCH_ID_KEY } from '@/lib/constants';
import { get, post } from '@/modules/native-request';
import md5 from '@/utils/md5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';

// const 只会使变量的引用不可变，但不代表变量的内容（如对象或数组）也是不可变的，因此需要补一个 as const
const JWCH_URLS = {
  LOGIN_CHECK: 'https://jwcjwxt1.fzu.edu.cn/logincheck.asp',
  VERIFY_CODE: 'https://jwcjwxt1.fzu.edu.cn/plus/verifycode.asp',
  SSO_LOGIN: 'https://jwcjwxt2.fzu.edu.cn/Sfrz/SSOLogin',
  LOGIN_CHECK_XS: 'https://jwcjwxt2.fzu.edu.cn:81/loginchk_xs.aspx',
} as const;

const DEFAULT_HEADERS: Record<string, string> = {
  REFERER: 'https://jwch.fzu.edu.cn',
  ORIGIN: 'https://jwch.fzu.edu.cn',
  'X-Requested-With': 'XMLHttpRequest',
};

const ERROR_MESSAGES: Record<string, string> = {
  用户名或密码错误: '用户名或密码错误',
  验证码验证失败: '验证码验证失败',
  处理URL失败: '处理URL失败',
  重新登录: '重新登录',
};

// 自动验证码识别服务地址(本科生教务系统)
const URL_AUTO_VALIDATE = 'https://fzuhelper.west2.online/api/v1/user/validate-code';

class UserLogin {
  #cookies: Record<string, string> = {};

  #setCookies(_newCookies: string) {
    const newCookies: Record<string, string> = Object.fromEntries(
      _newCookies
        .split(',')
        .map(cookie => cookie.trim())
        .map(cookie => cookie.split(';')[0].split('=')),
    );

    // 后面的 newCookies 会覆盖前面的 this.#cookies
    this.#cookies = { ...this.#cookies, ...newCookies };
  }

  #getCookies() {
    return Object.entries(this.#cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  #responseToString(response: Uint8Array) {
    return Buffer.from(response).toString('utf-8').replace(/\s+/g, '');
  }

  #checkErrors(data: string): string | null {
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (data.includes(key)) {
        return message;
      }
    }
    return null;
  }

  async #get(url: string, headers: Record<string, string>) {
    const { data, headers: resHeaders } = await get(url, headers);

    if (resHeaders['Set-Cookie']) {
      this.#setCookies(resHeaders['Set-Cookie']);
    }

    return data;
  }

  async #post(url: string, headers: Record<string, string>, formData: Record<string, string>) {
    const { data, headers: resHeaders } = await post(url, headers, formData);

    if (resHeaders['Set-Cookie']) {
      this.#setCookies(resHeaders['Set-Cookie']);
    }

    return data;
  }

  getCaptcha() {
    return this.#get(JWCH_URLS.VERIFY_CODE, DEFAULT_HEADERS);
  }

  async #loginCheck(username: string, password: string, captcha: string) {
    const headers = {
      ...DEFAULT_HEADERS,
      Cookie: this.#getCookies(),
    };
    const formData = {
      muser: username,
      passwd: await md5(password, 16),
      Verifycode: captcha,
    };

    const _data = await this.#post(JWCH_URLS.LOGIN_CHECK, headers, formData);
    const data = this.#responseToString(_data);
    const result = this.#checkErrors(data);
    if (result) {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: result,
      };
    }

    const token = /token=(.*?)&/.exec(data)?.[1];
    const id = /id=(.*?)&/.exec(data)?.[1];
    const num = /num=(.*?)&/.exec(data)?.[1];

    if (!token || !id || !num) {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: '教务处未返回有效 Token\n 可能原因: 验证码输入失败，教务处正在进行维护',
      };
    }

    return { token, id, num };
  }

  async #ssoLogin(token: string) {
    const headers = {
      ...DEFAULT_HEADERS,
      // Cookie: this.#getCookies(),
    };
    const formData = { token };

    const _data = await this.#post(JWCH_URLS.SSO_LOGIN, headers, formData);
    const data = JSON.parse(this.#responseToString(_data));

    // {"code":200,"info":"登录成功","data":{}}
    if (data.code !== 200) {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: '教务处服务器 SSOLogin 失败',
      };
    }

    return true;
  }

  async #finishLogin(id: string, num: string) {
    const reqUrl = `${JWCH_URLS.LOGIN_CHECK_XS}?id=${id}&num=${num}&ssourl=https://jwcjwxt2.fzu.edu.cn&hosturl=https://jwcjwxt2.fzu.edu.cn:81&ssologin=`;
    const headers = {
      ...DEFAULT_HEADERS,
      Cookie: this.#getCookies(),
    };

    const _data = await this.#get(reqUrl, headers);
    const data = this.#responseToString(_data);
    const resId = /id=(.*?)&/.exec(data)?.[1];

    if (!resId) {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: '教务系统用户 ID 获取失败',
      };
    }

    return { id: resId };
  }

  async autoVerifyCaptcha(data: Uint8Array) {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const localId = await AsyncStorage.getItem(JWCH_ID_KEY);
    const localCookies = await AsyncStorage.getItem(JWCH_COOKIES_KEY);
    const response = await axios.request({
      url: URL_AUTO_VALIDATE,
      method: 'POST',
      headers: {
        'Access-Token': accessToken,
        Authorization: accessToken,
        Id: localId,
        Cookies: localCookies,
      },
      data: {
        image: `data:image/png;base64,${btoa(String.fromCharCode(...data))}`,
      },
    });

    if (!response.data.data) {
      console.error('自动验证码识别失败,HTTP JSON:', JSON.stringify(response.data));
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: '自动验证码识别失败',
      };
    }

    return response.data.data;
  }

  async login(username: string, password: string, _captcha: string | Uint8Array) {
    let captcha: string;

    if (typeof _captcha !== 'string') {
      captcha = await this.autoVerifyCaptcha(_captcha);
    } else {
      captcha = _captcha;
    }

    const { token, id: id0, num } = await this.#loginCheck(username, password, captcha);
    await this.#ssoLogin(token);
    const { id } = await this.#finishLogin(id0, num);

    return {
      id: id,
      cookies: this.#getCookies(),
    };
  }
}

export default UserLogin;
