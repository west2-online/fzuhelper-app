import AsyncStorage from '@react-native-async-storage/async-storage';

const YMT_URLS = {
  LOGIN: 'https://oss.fzu.edu.cn/api/qr/login/getAccessToken',
  PAY_CODE: 'https://oss.fzu.edu.cn/api/qr/deal/getQrCode',
  IDENTIFY: 'https://oss.fzu.edu.cn/api/qr/device/getQrCode',
};

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
  async #request(
    method: string,
    url: string,
    headers: Record<string, string> = {},
    formData: Record<string, string> = {},
  ) {
    const options: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (method !== 'GET' && method !== 'HEAD') {
      options.body = JSON.stringify(formData);
    }

    const resp = await fetch(url, options);

    if (!resp.ok) {
      throw new Error('远端服务异常');
    }

    const respData = await resp.json();
    console.log(respData);
    if (respData.code !== 0) {
      throw new Error(respData.msg);
    }

    return respData;
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
      throw Error('账号密码不能为空');
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
      throw Error('accessToken 不能为空');
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
      throw Error('accessToken 不能为空');
    }

    const identifyCodeData = await this.#get({
      url: YMT_URLS.IDENTIFY,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return identifyCodeData.data;
  }
  // 退出登录
  async logout() {
    await AsyncStorage.removeItem('accessToken');
  }
}

export default YMTLogin;
