import { RejectEnum } from '@/api/enum';
import { ACCESS_TOKEN_KEY } from '@/lib/constants';
import { get, post } from '@/modules/native-request';
import { type RejectError } from '@/types/reject-error';
import { base64, md5 } from '@/utils/crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';

// 用于提供类型检查，本文件中所有的 throw 和 Promise.reject 都应该使用这个保证类型安全
function rejectWith(obj: RejectError) {
  return Promise.reject(obj);
}

// const 只会使变量的引用不可变，但不代表变量的内容（如对象或数组）也是不可变的，因此需要补一个 as const
// 本科生教务系统
const JWCH_URLS = {
  LOGIN_CHECK: 'https://jwcjwxt2.fzu.edu.cn:82/logincheck.asp',
  VERIFY_CODE: 'https://jwcjwxt2.fzu.edu.cn:82/plus/verifycode.asp',
  SSO_LOGIN: 'https://jwcjwxt2.fzu.edu.cn/Sfrz/SSOLogin',
  LOGIN_CHECK_XS: 'https://jwcjwxt2.fzu.edu.cn:81/loginchk_xs.aspx',
} as const;

const YJSY_URLS = {
  LOGIN: 'https://yjsglxt.fzu.edu.cn/login.aspx',
} as const;

const DEFAULT_HEADERS_UNDERGRADUATE: Record<string, string> = {
  REFERER: 'https://jwch.fzu.edu.cn',
  ORIGIN: 'https://jwch.fzu.edu.cn',
  'X-Requested-With': 'XMLHttpRequest',
};

const DEFAULT_HEADERS_GRADUATE: Record<string, string> = {
  REFERER: 'https://yjsy.fzu.edu.cn',
  ORIGIN: 'https://yjsy.fzu.edu.cn',
  HOST: 'yjsglxt.fzu.edu.cn',
  'Content-Type': 'application/x-www-form-urlencoded',
  'Upgrade-Insecure-Requests': '1',
};

// (本科生教务系统) 自动验证码识别服务地址
const URL_AUTO_VALIDATE = 'https://fzuhelper.west2.online/api/v1/user/validate-code';
// (研究生教务系统) 自动填充 ID 前缀，因为用不到，服务端默认 5 个前导 0，避免问题直接设置为 10个 0
const GRADUATE_ID_PREFIX = '00000';

// 这个 UserLogin 同时支持本科生和研究生的登录逻辑。其中本科生登录逻辑较为复杂，研究生的比较简单
class UserLogin {
  #cookies: Record<string, string> = {};

  #setCookies(_newCookies: any) {
    let newCookies: Record<string, string> = {};
    if (typeof _newCookies === 'string') {
      console.log('cookie is string');
      newCookies = Object.fromEntries(
        (_newCookies as string)
          .split(',')
          .map(cookie => cookie.trim())
          .map(cookie => cookie.split(';')[0].split('=')),
      );
    } else if (Array.isArray(_newCookies)) {
      console.log('cookie is array');
      newCookies = Object.fromEntries(
        (_newCookies as string[]).map(cookie => cookie.trim()).map(cookie => cookie.split(';')[0].split('=')),
      );
    } else {
      console.log('cookie is unknown', typeof _newCookies);
      return;
    }

    // 后面的 newCookies 会覆盖前面的 this.#cookies
    this.#cookies = { ...this.#cookies, ...newCookies };
  }

  #getCookies() {
    return Object.entries(this.#cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  #clearCookies() {
    this.#cookies = {};
  }

  #responseToString(response: Uint8Array) {
    return Buffer.from(response).toString('utf-8').replace(/\s+/g, '');
  }

  // 解析错误 alert
  #parseErrors(data: string): string | null {
    const alertRegex = /<script[^>]*>\s*alert\(['"](.+?)['"]\);[^>]*\s*<\/script>/;
    const match = data.match(alertRegex);
    if (match) {
      return match[1];
    }
    return null;
  }

  async #get(url: string, headers: Record<string, string>) {
    const { data, headers: resHeaders } = await get(url, headers);

    if (resHeaders['Set-Cookie']) {
      this.#setCookies(resHeaders['Set-Cookie']);
    }
    if (resHeaders['set-cookie']) {
      this.#setCookies(resHeaders['set-cookie']);
    }

    return data;
  }

  async #post(url: string, headers: Record<string, string>, formData: Record<string, string>) {
    const { data, headers: resHeaders } = await post(url, headers, formData);

    if (resHeaders['Set-Cookie']) {
      this.#setCookies(resHeaders['Set-Cookie']);
    }
    if (resHeaders['set-cookie']) {
      this.#setCookies(resHeaders['set-cookie']);
    }

    return { data: data, headers: resHeaders };
  }

  // 获取验证码（仅限本科生教务系统，研究生教务系统没有验证码）
  async getCaptcha(): Promise<Uint8Array> {
    return await this.#get(JWCH_URLS.VERIFY_CODE, DEFAULT_HEADERS_UNDERGRADUATE);
  }

  // （本科生教务系统）执行 logincheck.asp 操作
  async #loginCheck(username: string, password: string, captcha: string) {
    const headers = {
      ...DEFAULT_HEADERS_UNDERGRADUATE,
      Cookie: this.#getCookies(),
    };
    const formData = {
      muser: username,
      passwd: await md5(password, 16),
      Verifycode: captcha,
    };

    const { data: _data, headers: resHeaders } = await this.#post(JWCH_URLS.LOGIN_CHECK, headers, formData);
    if (!_data) {
      return rejectWith({
        type: RejectEnum.NativeLoginFailed,
        data: '接收到数据为空',
      });
    }

    const data = this.#responseToString(_data);
    // 如果验证出错，这里不会 302 跳转，而是返回一个带有 alert 的页面
    if (!resHeaders.Location) {
      const result = this.#parseErrors(data);
      // 本科教务系统如果输错账号（比如输成身份证），没有 302 也没有 alert
      return rejectWith({
        type: RejectEnum.NativeLoginFailed,
        data: result ?? '请确认账号是否为正确的学号',
      });
    }

    const token = /token=(.*?)&/.exec(data)?.[1];
    const id = /id=(.*?)&/.exec(data)?.[1];
    const num = /num=(.*?)&/.exec(data)?.[1];

    if (!token || !id || !num) {
      return rejectWith({
        type: RejectEnum.NativeLoginFailed,
        data: '教务处未返回有效 Token\n可能原因: 验证码识别失败，教务处正在进行维护',
      });
    }

    return { token, id, num };
  }

  // (本科生教务系统) 执行 SSOLogin 操作
  async #ssoLogin(token: string) {
    const headers = {
      ...DEFAULT_HEADERS_UNDERGRADUATE,
      // Cookie: this.#getCookies(),
    };
    const formData = { token };

    const { data: _data } = await this.#post(JWCH_URLS.SSO_LOGIN, headers, formData);
    const data = JSON.parse(this.#responseToString(_data));

    // {"code":200,"info":"登录成功","data":{}}
    if (data.code !== 200) {
      return rejectWith({
        type: RejectEnum.NativeLoginFailed,
        data: '教务处服务器 SSOLogin 失败\n可能原因：账号冲突，教务处正在进行维护',
      });
    }

    return true;
  }

  // (本科生教务系统) 完成登录
  async #finishLogin(id: string, num: string) {
    const reqUrl = `${JWCH_URLS.LOGIN_CHECK_XS}?id=${id}&num=${num}&ssourl=https://jwcjwxt2.fzu.edu.cn&hosturl=https://jwcjwxt2.fzu.edu.cn:81&ssologin=`;
    const headers = {
      ...DEFAULT_HEADERS_UNDERGRADUATE,
      Cookie: this.#getCookies(),
    };

    const _data = await this.#get(reqUrl, headers);
    const data = this.#responseToString(_data);
    const resId = /id=(.*?)&/.exec(data)?.[1];

    if (!resId) {
      return rejectWith({
        type: RejectEnum.NativeLoginFailed,
        data: '教务系统用户 ID 获取失败\n可能原因：账号冲突，教务处正在进行维护',
      });
    }

    return { id: resId };
  }

  // (本科生教务系统) 自动验证码识别
  async autoVerifyCaptcha(data: Uint8Array) {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const response = await axios.request({
      url: URL_AUTO_VALIDATE,
      method: 'POST',
      headers: {
        'Access-Token': accessToken,
        Authorization: accessToken,
      },
      data: {
        image: `data:image/png;base64,${btoa(String.fromCharCode(...data))}`,
      },
    });

    if (!response.data.data) {
      console.error('自动验证码识别失败,HTTP JSON:', JSON.stringify(response.data));
      return rejectWith({
        type: RejectEnum.NativeLoginFailed,
        data: '自动验证码识别失败',
      });
    }

    return response.data.data;
  }

  // (研究生教务系统) 登录
  async #graduateLogin(username: string, password: string) {
    const headers = {
      ...DEFAULT_HEADERS_GRADUATE,
      Cookie: this.#getCookies(),
    };
    const formData = {
      muser: username,
      passwd: base64(password),
      'imageField2.x': '35', // 非必需，但官网请求是携带的
      'imageField2.y': '19', // 非必需，但官网请求是携带的
    };

    const { data: _data, headers: resHeaders } = await this.#post(YJSY_URLS.LOGIN, headers, formData);
    // 需要判断_data是否为 null
    if (!_data) {
      return rejectWith({
        type: RejectEnum.NativeLoginFailed,
        data: '接收到数据为空',
      });
    }

    // 下面是判断登录成功的确认，登录成功时会是一个 302，所以直接判断是否有 Location 头即可
    if (!resHeaders.Location) {
      const data = this.#responseToString(_data);
      const result = this.#parseErrors(data);
      this.#clearCookies(); // 清空 cookie
      return rejectWith({
        type: RejectEnum.NativeLoginFailed,
        data: result ?? '研究生教务系统登录失败',
      });
    }

    return;
  }

  async login(username: string, password: string, _captcha?: string, isPostGraduate = false) {
    let identifier: string;

    if (!isPostGraduate) {
      // 本科生
      let captcha: string;
      if (!_captcha) {
        const captchaImage = await this.getCaptcha();
        captcha = await this.autoVerifyCaptcha(captchaImage);
        console.log('auto verify captcha result:', captcha);
      } else {
        captcha = _captcha;
      }
      const { token, id: id0, num } = await this.#loginCheck(username, password, captcha);
      await this.#ssoLogin(token);
      const { id } = await this.#finishLogin(id0, num);
      identifier = id;
    } else {
      // 研究生
      await this.#graduateLogin(username, password);
      identifier = GRADUATE_ID_PREFIX + username; // 采用前导 0 拼接
    }

    return {
      id: identifier,
      cookies: this.#getCookies(),
    };
  }
}

export default UserLogin;
