import { RejectEnum } from '@/api/enum';
import { get, postJSON } from '@/modules/native-request';
import { Buffer } from 'buffer';
import CryptoJs from 'crypto-js';
const SSO_LOGIN_URL = 'https://sso.fzu.edu.cn/login';

class ssoLogin {
  // 公共请求方法，使用 Native-Request 模块
  async #request(
    method: 'GET' | 'POST',
    url: string,
    headers: Record<string, string> = {},
    formData: Record<string, string> = {},
  ) {
    let response;

    headers = {
      ...headers,
    };
    try {
      if (method === 'GET') {
        return await get(url, headers);
      } else if (method === 'POST') {
        response = await postJSON(url, headers, formData);
        const { data } = response;
        const parsedData = Buffer.from(data).toString('utf-8');
        console.log('请求成功:', parsedData);

        return JSON.parse(parsedData);
      } else
        throw {
          type: RejectEnum.NativeLoginFailed,
          data: 'HTTP请求方法错误',
        };
    } catch (error) {
      console.error('请求错误:', error);
      throw error;
    }
  }

  // 自定义 POST 方法
  async #post({
    url,
    headers = {},
    formData = {},
  }: {
    url: string;
    headers?: Record<string, string>;
    formData?: Record<string, string>;
  }) {
    return this.#request('POST', url, headers, formData);
  }

  // 自定义 GET 方法
  async #get({ url, headers = {} }: { url: string; headers?: Record<string, string> }) {
    return this.#request('GET', url, headers);
  }

  async login(account: string, password: string) {
    // 首先请求sso界面获得密钥
    const ssoPage = await this.#get({ url: SSO_LOGIN_URL });
    let html: string;
    html = Buffer.from(ssoPage.data).toString('utf-8');

    // 从页面中提取密钥 和 cookie的session
    const matchCroypto = html.match(/"login-croypto">(.*?)</);
    const matchExecution = html.match(/"login-page-flowkey">(.*?)</);
    if (!matchCroypto || !matchExecution) {
      throw new Error('无法从页面中提取密钥');
    }
    const croypto: string = matchCroypto[1];
    const execution: string = matchExecution[1];
    const SESSION: string = ssoPage.headers['Set-Cookie'].match(/SESSION=(.*?);/)[1];

    // 构建登录数据
    const data = {
      username: account,
      type: 'UsernamePassword',
      _eventId: 'submit',
      geolocation: '',
      execution: execution,
      captcha_code: '',
      croypto: croypto,
      password: encrypt(password, croypto),
    };

    // TODO 这里不对，应该是302跳转但是返回的是200
    // 发送登录请求
    const resp = await this.#post({
      url: SSO_LOGIN_URL,
      headers: {
        Cookie: `SESSION=${SESSION}`,
      },
      formData: data,
    });

    return resp;
  }
}

function encrypt(raw_password: string, keyBase64: string): string {
  /**
   * @param raw_password 待加密的密码
   * @param key 认证页获得的base64编码的加密密钥
   * @returns 加密后的密码（base64格式）
   **/
  // 解码 base64 格式的密钥
  const key = CryptoJs.enc.Base64.parse(keyBase64);

  // 通过 DES 加密明文密码，使用 ECB 模式和 PKCS7 填充
  const encrypted = CryptoJs.DES.encrypt(raw_password, key, {
    mode: CryptoJs.mode.ECB,
    padding: CryptoJs.pad.Pkcs7,
  });

  // 返回 base64 编码格式的加密后密码
  return encrypted.toString();
}

export default ssoLogin;
