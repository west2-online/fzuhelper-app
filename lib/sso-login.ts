import { SSO_LOGIN_COOKIE_KEY, SSO_LOGIN_URL } from '@/lib/constants';
import { get, post } from '@/modules/native-request';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import CryptoJs from 'crypto-js';

// 用于提取 Set-Cookie 中的内容
function extractKV(raw: string, key: string): string {
  /**
   * 适用于提取 Set-Cookie 中的键值对,URL parms中的键值对
   * @param raw 字符串
   * @param name 需要提取的键名
   * @returns 键名对应的值
   *
   **/
  const regex = new RegExp(`${key}=([^;]+)`);
  const match = raw.match(regex);
  if (!match || !match[1]) {
    throw new Error(`无法从cookie中提取${key}`);
  }
  return match[1];
}

class ssoLogin {
  // 公共请求方法，使用 Native-Request 模块
  async #request(
    method: 'GET' | 'POST',
    url: string,
    headers: Record<string, string> = {},
    formData: Record<string, string> = {},
  ) {
    try {
      if (method === 'GET') {
        return await get(url, headers);
      } else {
        return await post(url, headers, formData);
      }
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
  // 登录, 返回并保存 cookie
  async login(account: string, password: string) {
    /**
     * @param account 学号
     * @param password 密码
     * @returns 登录成功后的 cookie
     **/

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
    const SESSION = extractKV(ssoPage.headers['Set-Cookie'], 'SESSION');

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

    // 发送登录请求
    const resp = await this.#post({
      url: SSO_LOGIN_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: `SESSION=${SESSION}`,
      },
      formData: data,
    });
    const SOURCEID_TGC = extractKV(resp.headers['Set-Cookie'], 'SOURCEID_TGC');
    const rg_objectid = extractKV(resp.headers['Set-Cookie'], 'rg_objectid');

    const cookies = `SOURCEID_TGC=${SOURCEID_TGC}; rg_objectid=${rg_objectid}`;

    await AsyncStorage.setItem(SSO_LOGIN_COOKIE_KEY, cookies);
    return cookies;
  }

  // 获取学习空间的token
  async getStudyToken() {
    let cookie: string = (await AsyncStorage.getItem(SSO_LOGIN_COOKIE_KEY)) ?? '';
    let resp;

    // 重定向1
    resp = await this.#get({
      url: 'https://sso.fzu.edu.cn/oauth2.0/authorize?response_type=code&client_id=wlwxt&redirect_uri=http://aiot.fzu.edu.cn/api/admin/sso/getIbsToken',
      headers: {
        Cookie: cookie,
      },
    });

    const SESSION = extractKV(resp.headers['Set-Cookie'], 'SESSION');
    cookie += `; SESSION=${SESSION}`;
    console.log('重定向1:', resp.headers);

    // 进行后续四次重定向
    for (let i = 0; i < 4; i++) {
      resp = await this.#get({
        url: resp.headers.Location,
        headers: {
          Cookie: cookie,
        },
      });
      console.log(`重定向${i + 2}:`, resp.headers);
    }

    // 从最后一次重定向中提取token
    const token = extractKV(resp.headers.Location, 'token');
    console.log('提取到的token:', token);
    return token;
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
