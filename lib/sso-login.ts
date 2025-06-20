import { Buffer } from 'buffer';
import CryptoJs from 'crypto-js';

import { RejectEnum } from '@/api/enum';
import { SSO_LOGIN_URL } from '@/lib/constants';
import { get, post } from '@/modules/native-request';

// 用于提取 Set-Cookie 中的内容
function extractKV(raw: string, key: string): string {
  /**
   * 适用于提取 Set-Cookie 中的键值对,URL parms中的键值对
   * @param raw 字符串
   * @param name 需要提取的键名
   * @returns 键名对应的值
   **/

  // 如果传入的 raw 不是字符串，抛出错误
  if (typeof raw !== 'string') {
    throw {
      type: RejectEnum.NativeLoginFailed,
      data: 'cookie 不是字符串',
    };
  }
  const regex = new RegExp(`${key}=([^;]+)`);
  const match = raw.match(regex);

  if (!match || !match[1]) {
    throw {
      type: RejectEnum.NativeLoginFailed,
      data: 'cookie 中没有找到: ' + key,
    };
  }

  return match[1];
}

class SSOLogin {
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
    const resp = this.#request('POST', url, headers, formData);
    // console.log(resp);
    return resp;
  }

  // 自定义 GET 方法
  async #get({ url, headers = {} }: { url: string; headers?: Record<string, string> }) {
    const resp = this.#request('GET', url, headers);
    // console.log(resp);
    return resp;
  }

  // 登录, 返回并保存 cookie
  async login(account: string, password: string) {
    /**
     * @param account 学号
     * @param password 密码
     * @returns 登录成功后的 cookie
     **/

    if (account === '' || password === '') {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: '账号密码不能为空',
      };
    }

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
      captcha_payload: encrypt('{}', croypto),
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

    const cookies = `SOURCEID_TGC=${SOURCEID_TGC}`;

    return cookies;
  }

  // 获取学习空间的token
  async getStudyToken(ssoCookie: string) {
    /**
     * @param ssoCookie 登录SSO后的cookie
     * @returns 学习空间的token
     **/
    if (ssoCookie === '') {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: 'SSOcookie不能为空,请先登录',
      };
    }

    let cookie = ssoCookie;
    let resp;
    try {
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
            'User-Agent':
              'Mozilla/5.0 (iPad; CPU OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 appId/cn.edu.fzu.fdxypa appScheme/kysk-fdxy-app hengfeng/fdxyappzs appType/2 ruijie-facecamera',
          },
        });
        console.log(`重定向${i + 2}:`, resp.headers);
      }
    } catch (error) {
      console.error('无法从SSO登录到学习空间:', error);
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: '无法从SSO登录到学习空间',
      };
    }

    // 从最后一次重定向中提取token
    const token = extractKV(resp.headers.Location, 'token');
    console.log('提取到的token:', token);
    return token;
  }

  // 获得公寓报修的cookie
  // 暂时无用，目前直接在webview中打开报修页面
  async getDomitoryRepairCookie(ssoCookie: string) {
    /**
     * @param ssoCookie 登录SSO后的cookie
     * @returns 公寓报修的cookie
     */

    if (ssoCookie === '') {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: 'SSOcookie不能为空,请先登录',
      };
    }

    let resp;
    let cookie; // 用于保存公寓报修cookie
    try {
      // 通过统一认证访问“宿舍报修”页面
      resp = await this.#get({
        url: 'https://sso.fzu.edu.cn/login?service=http:%2F%2Fehall.fzu.edu.cn%2Fssfw%2Fsys%2Fswmssbxapp%2F*default%2Findex.do',
        headers: {
          Cookie: ssoCookie,
        },
      });
      // 返回重定向后的url，这个url就是“宿舍报修”页面的url,访问该url不需要携带cookie，通过url路径中的ticket作为凭证
      resp = await this.#get({
        url: resp.headers.Location,
      });
      // 访问后会有返回一个_WEU的cookie,后续的流程都用到这个cookie
      const WEU = extractKV(resp.headers['Set-Cookie'], '_WEU');
      cookie = `_WEU=${WEU}`;

      // 第一次更新cookie
      resp = await this.#get({
        url: 'http://ehall.fzu.edu.cn/ssfw/sys/emappagelog/config/swmssbxapp.do',
        headers: {
          Cookie: cookie,
        },
      });
      console.log('第一次更新cookie:', resp.headers);
      console.log('响应体', JSON.parse(Buffer.from(resp.data).toString('utf-8')));

      // 第二次更新cookie
      resp = await this.#post({
        url: 'http://ehall.fzu.edu.cn/ssfw/sys/xgutilapp/MobileCommon/getSelRoleConfig.do',
        headers: {
          Cookie: cookie,
        },
        formData: {
          data: '{"APPID":"4970001248812463","APPNAME":"swmssbxapp"}',
        },
      });
      cookie = `_WEU=${extractKV(resp.headers['Set-Cookie'], '_WEU')}`;
      console.log('第二次更新cookie:', resp.headers);
      console.log('响应体', JSON.parse(Buffer.from(resp.data).toString('utf-8')));

      // 这登录真是糖丸了，最后一次更新cookie
      resp = await this.#post({
        url: 'http://ehall.fzu.edu.cn/ssfw/sys/xgutilapp/MobileCommon/getMenuInfo.do',
        headers: {
          Cookie: cookie,
        },
        formData: { data: '{"APPID":"4970001248812463","APPNAME":"swmssbxapp"}' },
      });
      cookie = `_WEU=${extractKV(resp.headers['Set-Cookie'], '_WEU')}`;
      console.log('第三次更新cookie:', resp.headers);
      console.log('响应体', JSON.parse(Buffer.from(resp.data).toString('utf-8')));

      return cookie;
    } catch (error) {
      console.error('无法从SSO登录到公寓报修:', error);
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: '无法从SSO登录到公寓报修',
      };
    }
  }
}

function encrypt(raw_password: string, keyBase64: string): string {
  /**
   * @param raw_password 待加密的密码
   * @param key 认证页获得的base64编码的加密密钥
   * @returns 加密后的密码（base64格式）
   *
   * 密码加密过程（AES-ECB + PKCS#7 + Base64）：
   * 1. 从认证页面获取 base64 格式的密钥
   * 2. 将密钥解码成 bytes 格式
   * 3. 对明文密码进行 AES-ECB 加密（PKCS#7 填充）
   * 4. 将加密结果 Base64 编码后返回
   **/
  // 解码 base64 格式的密钥
  const key = CryptoJs.enc.Base64.parse(keyBase64);

  // 通过 AES 加密明文密码，使用 ECB 模式和 PKCS7 填充
  const encrypted = CryptoJs.AES.encrypt(raw_password, key, {
    mode: CryptoJs.mode.ECB,
    padding: CryptoJs.pad.Pkcs7,
  });

  // 返回 base64 编码格式的加密后密码
  return encrypted.toString();
}

export default SSOLogin;
