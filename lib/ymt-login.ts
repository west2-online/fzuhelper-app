const YMT_URLS = {
  LOGIN: 'https://oss.fzu.edu.cn/api/qr/login/getAccessToken',
  PAY_CODE: 'https://oss.fzu.edu.cn/api/qr/deal/getQrCode',
};

interface LoginRespData {
  name: string;
  accessToken: string;
}

export interface PayCodeResData {
  devId: string;
  expiredTime: string;
  payAcctId: string;
  payPrdCode: string;
  prePayId: string;
}

class YMTLogin {
  async #post(url: string, headers: Record<string, string> = {}, formData: Record<string, string> = {}) {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(formData),
    });

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

  async login(userId: string, password: string): Promise<LoginRespData> {
    if (userId === '' || password === '') {
      throw Error('账号密码不能为空');
    }

    const loginData = await this.#post(
      YMT_URLS.LOGIN,
      {},
      {
        isNotPermanent: 'false',
        username: userId,
        password: password,
      },
    );

    return {
      name: loginData.data.name,
      accessToken: loginData.data.access_token,
    };
  }

  async getPayCode(accessToken: string): Promise<PayCodeResData[]> {
    if (accessToken === '') {
      throw Error('accessToken 不能为空');
    }

    const payCodeData = await this.#post(YMT_URLS.PAY_CODE, {
      Authorization: `Bearer ${accessToken}`,
    });

    return payCodeData.data;
  }
}

export default YMTLogin;
