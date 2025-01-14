import { Buffer } from 'buffer';

import { get, post } from '@/modules/native-request';
import md5 from '@/utils/md5';

const JWCH_URLS = {
  LOGIN_CHECK: 'https://jwcjwxt1.fzu.edu.cn/logincheck.asp',
  VERIFY_CODE: 'https://jwcjwxt1.fzu.edu.cn/plus/verifycode.asp',
  SSO_LOGIN: 'https://jwcjwxt2.fzu.edu.cn/Sfrz/SSOLogin',
  LOGIN_CHECK_XS: 'https://jwcjwxt2.fzu.edu.cn:81/loginchk_xs.aspx',
};

const defaultHeaders = {
  REFERER: 'https://jwch.fzu.edu.cn',
  ORIGIN: 'https://jwch.fzu.edu.cn',
  'X-Requested-With': 'XMLHttpRequest',
};

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
    return this.#get(JWCH_URLS.VERIFY_CODE, defaultHeaders);
  }

  async #loginCheck(username: string, password: string, captcha: string) {
    const headers = {
      ...defaultHeaders,
      Cookie: this.#getCookies(),
    };
    const formData = {
      muser: username,
      passwd: md5(password, 16),
      Verifycode: captcha,
    };

    const _data = await this.#post(JWCH_URLS.LOGIN_CHECK, headers, formData);
    const data = this.#responseToString(_data);
    const token = /token=(.*?)&/.exec(data)?.[1];
    const id = /id=(.*?)&/.exec(data)?.[1];
    const num = /num=(.*?)&/.exec(data)?.[1];

    if (!token || !id || !num) {
      throw new Error('登录失败: 教务处未返回有效 Token');
    }

    return { token, id, num };
  }

  async #ssoLogin(token: string) {
    const headers = {
      ...defaultHeaders,
      // Cookie: this.#getCookies(),
    };
    const formData = { token };

    const _data = await this.#post(JWCH_URLS.SSO_LOGIN, headers, formData);
    const data = JSON.parse(this.#responseToString(_data));

    // {"code":200,"info":"登录成功","data":{}}
    if (data.code !== 200) {
      throw new Error('登录失败: SSOLogin failed');
    }

    return true;
  }

  async #finishLogin(id: string, num: string) {
    const reqUrl = `${JWCH_URLS.LOGIN_CHECK_XS}?id=${id}&num=${num}&ssourl=https://jwcjwxt2.fzu.edu.cn&hosturl=https://jwcjwxt2.fzu.edu.cn:81&ssologin=`;
    const headers = {
      ...defaultHeaders,
      Cookie: this.#getCookies(),
    };

    const _data = await this.#get(reqUrl, headers);
    const data = this.#responseToString(_data);
    const resId = /id=(.*?)&/.exec(data)?.[1];

    if (!resId) {
      throw new Error('登录失败: 教务系统用户 ID 获取失败');
    }

    return { id: resId };
  }

  #autoVerifyCaptcha(data: Uint8Array) {
    throw new Error('尚未实现。');
    return '';
  }

  async login(username: string, password: string, _captcha: string | Uint8Array) {
    let captcha: string;

    if (typeof _captcha !== 'string') {
      captcha = this.#autoVerifyCaptcha(_captcha);
    } else {
      captcha = _captcha;
    }

    const { token, id: id0, num } = await this.#loginCheck(username, password, captcha);
    await this.#ssoLogin(token);
    const { id } = await this.#finishLogin(id0, num);

    return {
      id,
      cookies: this.#getCookies(),
    };
  }
}

export default UserLogin;
