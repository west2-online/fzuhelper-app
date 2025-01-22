import { RejectEnum } from '@/api/enum';
import { get, postJSON } from '@/modules/native-request';
import { Buffer } from 'buffer';

const YMT_URLS = {
  LOGIN: 'https://oss.fzu.edu.cn/api/qr/login/getAccessToken',
  PAY_CODE: 'https://oss.fzu.edu.cn/api/qr/deal/getQrCode',
  IDENTIFY: 'https://oss.fzu.edu.cn/api/qr/device/getQrCode',
  RENEW: 'https://oss.fzu.edu.cn/api/qr/login/tokenRenew',
} as const;

interface LoginRespData {
  name: string;
  accessToken: string;
}

export interface PayCodeRespData {
  devId: string;
  expiredTime: string;
  payAcctId: string;
  payPrdCode: string;
  prePayId: string;
}

export interface IdentifyRespData {
  color: string; // 颜色
  validTime: number; // 有效时间
  content: string; // 内容
}

class YMTLogin {
  // 公共请求方法，使用 Native-Request 模块
  async #request(
    method: 'GET' | 'POST',
    url: string,
    headers: Record<string, string> = {},
    formData: Record<string, string> = {},
  ) {
    try {
      let response;

      headers = {
        'Content-Type': 'application/json',
        ...headers,
      };

      if (method === 'GET') {
        response = await get(url, headers);
      } else if (method === 'POST') {
        response = await postJSON(url, headers, formData);
      } else {
        throw {
          type: RejectEnum.NativeLoginFailed,
          data: 'HTTP请求方法错误',
        };
      }

      const { data } = response;
      const jsonData = JSON.parse(Buffer.from(data).toString('utf-8'));

      // 检查响应码是否为成功
      if (jsonData.code !== 0) {
        throw {
          type: RejectEnum.BizFailed,
          data: jsonData.msg || '未知错误',
        };
      }

      return jsonData;
    } catch (error: any) {
      // 捕获错误并统一抛出格式
      if (error.type && error.data) {
        throw error; // 如果已经是我们定义的错误格式，直接抛出
      }

      throw {
        type: RejectEnum.NativeLoginFailed,
        data: error.message || '请求失败',
      };
    }
  }

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

  async #get({ url, headers = {} }: { url: string; headers?: Record<string, string> }) {
    return this.#request('GET', url, headers);
  }

  // 登录
  async login(userId: string, password: string): Promise<LoginRespData> {
    if (userId === '' || password === '') {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: '账号密码不能为空',
      };
    }

    const loginData = await this.#post({
      url: YMT_URLS.LOGIN,
      formData: {
        isNotPermanent: 'false',
        username: userId,
        password: password,
      },
    });

    return {
      name: loginData.data.name,
      accessToken: loginData.data.access_token,
    };
  }

  // 消费码
  async getPayCode(accessToken: string): Promise<PayCodeRespData[]> {
    if (accessToken === '') {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: 'accessToken 不能为空',
      };
    }

    const payCodeData = await this.#post({
      url: YMT_URLS.PAY_CODE,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return payCodeData.data;
  }

  // 认证码
  async getIdentifyCode(accessToken: string): Promise<IdentifyRespData> {
    if (accessToken === '') {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: 'accessToken 不能为空',
      };
    }

    const identifyCodeData = await this.#get({
      url: YMT_URLS.IDENTIFY,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return identifyCodeData.data;
  }

  // Token 续期，每成功获取一次码就续期一次
  async getRenewToken(accessToken: string): Promise<string> {
    if (accessToken === '') {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: 'accessToken 不能为空',
      };
    }

    const tokenRenewRespData = await this.#get({
      url: YMT_URLS.RENEW,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return tokenRenewRespData.data.access_token;
  }
}

export default YMTLogin;
