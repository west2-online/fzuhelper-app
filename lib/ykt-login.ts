import { RejectEnum } from '@/api/enum';
import { get, postJSON } from '@/modules/native-request';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { privateDecrypt } from 'react-native-quick-crypto';
import SSOLogin from './sso-login';

interface OfflineCodeParams {
  offline_userdata: string; // 十六进制字符串
  userhashkey: string; // 十六进制字符串，RSA加密的对称密钥
  offline_effective_time: string; // 有效时间
  version: string; // 版本号，如 "1" 表示 v2，其他表示 v3
  currentCount: number; // 当前使用次数
}

interface QRCodeGeneratorResult {
  result: string;
  dataString?: string;
  barCode?: string;
  error?: string;
}

const YKT_URLS = {
  GET_AUTH:
    'https://xcx.fzu.edu.cn/berserker-auth/cas/login/ruiJie?targetUrl=https%3A%2F%2Fxcx.fzu.edu.cn%2Fberserker-base%2Fredirect%3FappId%3D16%26nodeId%3D15%26type%3Dapp',
  GET_USER_INFO: 'https://xcx.fzu.edu.cn/berserker-base/user?synAccessSource=h5',
  GET_CODEBAR_PAY_INFO: 'https://xcx.fzu.edu.cn/berserker-app/ykt/tsm/codebarPayinfo?synAccessSource=h5',
  GET_OFFLINE_PAY_INFO: 'https://xcx.fzu.edu.cn/berserker-app/ykt/tsm/offlienPar',
  GET_FRONT_INFO: 'https://xcx.fzu.edu.cn/berserker-app/frontInfo?synAccessSource=h5',
  REFERER: 'https://xcx.fzu.edu.cn/plat/pay?appId=16&nodeId=15',
};

export default class YKTLogin {
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
      if (jsonData.code !== 200) {
        // 根据文档，成功是 200
        throw {
          type: RejectEnum.BizFailed,
          data: jsonData,
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

  // 登录获取 synjones-auth
  async login(account: string, password: string): Promise<string> {
    if (account === '' || password === '') {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: '账号密码不能为空',
      };
    }

    const sso = new SSOLogin();
    const loginResult = await sso.login(account, password);

    // 检查登录结果
    if (typeof loginResult === 'string' || !loginResult.ticket) {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: '获取 ticket 失败',
      };
    }

    const authUrl = `${YKT_URLS.GET_AUTH}&ticket=${loginResult.ticket}`;
    console.log('Auth URL:', authUrl);
    const authResp = await get(authUrl, {
      Host: 'xcx.fzu.edu.cn',
      Referer:
        'https://sso.fzu.edu.cn/login?service=https:%2F%2Fxcx.fzu.edu.cn%2Fberserker-auth%2Fcas%2Flogin%2FruiJie%3FtargetUrl%3Dhttps%253A%252F%252Fxcx.fzu.edu.cn%252Fberserker-base%252Fredirect%253FappId%253D16%2526nodeId%253D15%2526type%253Dapp',
    }); // 使用 get 直接，因为 #get 会解析 JSON，但这里是重定向
    console.log('Auth Response Headers:', authResp.headers);

    // 从 Location 提取 synjones-auth
    const location = authResp.headers.Location;
    if (!location) {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: '获取 synjones-auth 失败',
      };
    }
    console.log('重定向地址:', location);
    const url = new URL(location);
    const synjonesAuth = url.searchParams.get('synjones-auth');
    if (!synjonesAuth) {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: 'synjones-auth 不存在',
      };
    }
    return synjonesAuth;
  }
  // 获取用户信息
  async getUserInfo(synjonesAuth: string): Promise<string> {
    if (synjonesAuth === '') {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: 'synjonesAuth 不能为空',
      };
    }

    const userInfoResp = await this.#get({
      url: YKT_URLS.GET_USER_INFO,
      headers: {
        'Synjones-Auth': `bearer ${synjonesAuth}`,
      },
    });

    return userInfoResp.data.name;
  }
  // 获取支付码
  async getPayCode(synjonesAuth: string): Promise<string> {
    if (synjonesAuth === '') {
      throw {
        type: RejectEnum.NativeLoginFailed,
        data: 'synjonesAuth 不能为空',
      };
    }
    console.log('获取支付码的 synjonesAuth:', synjonesAuth);
    // 获取 codebarPayinfo
    const codebarResp = await this.#get({
      url: YKT_URLS.GET_CODEBAR_PAY_INFO,
      headers: {
        Referer: YKT_URLS.REFERER,
        Synaccesssource: 'h5',
        'Synjones-Auth': `bearer ${synjonesAuth}`,
      },
    });
    console.log('Codebar Pay Info Response:', codebarResp);
    const payInfo = codebarResp.data[0]; // 假设取第一个
    const payacc = payInfo.payacc;
    const paytype = payInfo.paytype;
    const voucher = payInfo.voucher;
    console.log('支付信息:', { payacc, paytype, voucher });
    // 获取 offline params
    const offlineUrl = `${YKT_URLS.GET_OFFLINE_PAY_INFO}?payacc=${payacc}&paytype=${paytype}&voucher=${voucher}&synAccessSource=h5`;
    const offlineResp = await this.#get({
      url: offlineUrl,
      headers: {
        Referer: YKT_URLS.REFERER,
        Synaccesssource: 'h5',
        'Synjones-Auth': `bearer ${synjonesAuth}`,
      },
    });
    console.log('Offline Pay Info Response:', offlineResp);
    const offlineParams: OfflineCodeParams = offlineResp.data;
    console.log('离线支付参数:', offlineParams);
    // 获取 privateKey
    const frontResp = await this.#get({ url: YKT_URLS.GET_FRONT_INFO });
    const config = JSON.parse(frontResp.data.getFrontConfig);
    // 使用提供的私钥，如果API返回的私钥不可用
    const privateKey =
      config.privateKey ||
      `-----BEGIN PRIVATE KEY-----MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBANU64/H2n5i6i2L9xs7TQ2nC7Oe8S/LkyiumV5YWoOjcbDzJ8Nm9JSBFSt12Y3mDmVT2guP763akpL4PU9rz30Vt9uL8EnjzGRvhwvIQq1HfI9z8c67GJbL1wOxLFknnXxPPicn7B5/nTN66zobrhhgbUDUTO4eBZCPryDf9/fJNAgMBAAECgYEAtBN2/BpOsFoiayhtJLBQR1pCXnasIWZMws5JO8zCecXldvUIfap6VyWN0zgvTCjybkl9QvK26UykgIpLRCcez2Yk4znIWS4AJb2TvcpbEIRt8mMICGtp9MNe54GieQ9dTQdKY2J4e+zJKHJUgut03M6CME8SYss0uu1RksiamGECQQDsm91KWfQEi5bOJJ5ippAYsGyQkByATzRqbGPXPCwZ1HRBrDMQBjE4u89EwKpb50H6HYbySB/Pqi6VI20Y6ltlAkEA5rSH02LaY3GIb5ihoD2D7oqbwt3x4bJvJRjq0oFr/tPkTrV9NyrdUcDzSSpJs4TXNwU8oV2+J0cQTwhd7gBwyQJARmEec81J/kgfNXZC/okY958Sy/Vx5OCqcLWJBS7K12wQoLA+CBgvb/a9cm/0vJ2PTHyX9V1qyPSQIqCFBRJA2QJAValGnZig2je3nygfKy5sJFBXEX3zaAgm+LFNz6e6f74RkaAVxDwoPUjVjJ8lCoESoB1Tq97w0giy54WFyu9i8QJAQY/ozmFhVLYEVJjk/c+KorA3j3Wt94x4SnIcq00Gj8bh8dVGydfPY5lVNLOAjMwofAETTrHVOxZLn+h28MX9Mg==-----END PRIVATE KEY-----`;
    console.log('Private Key:', privateKey);
    // 生成二维码数据
    return this.#generateQRCodeDataString(payacc, offlineParams, privateKey);
  }

  // 辅助函数
  #padHex(hex: string): string {
    return (hex.length % 2 !== 0 ? '0' : '') + hex;
  }

  #getLengthHexPrefix(lengthHex: string): string {
    return this.#padHex((lengthHex.length / 2).toString(16).toUpperCase());
  }

  // 生成二维码数据字符串
  async #generateQRCodeDataString(
    payacc: string,
    offlineParams: OfflineCodeParams,
    privateKeyPem: string,
  ): Promise<string> {
    try {
      // RSA 解密 userhashkey，使用 PKCS#1 v1.5 填充
      const decryptedBuffer = privateDecrypt(
        {
          key: privateKeyPem,
          padding: 1, // RSA_PKCS1_PADDING
        },
        Buffer.from(offlineParams.userhashkey, 'hex'),
      );

      const decrypted = decryptedBuffer.toString('hex');

      // 将 payacc 转换为十六进制字符串
      const payaccHex = Array.from(payacc, char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');

      // 获取 headerBytes
      const headerBytes = this.#generateHeaderBytes(offlineParams);

      // 拼接数据进行 SHA1 哈希
      const dataToHash = decrypted + payaccHex + headerBytes;
      const hash = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA1, Buffer.from(dataToHash, 'hex'));
      const hashHex = Buffer.from(hash).toString('hex');

      // 拼接最终的 QR 数据字符串
      const qrDataString = hashHex + decrypted + payaccHex + headerBytes;

      // 转换为字节数组
      const qrDataBytes = Buffer.from(qrDataString, 'hex');

      // 根据版本拼接字节 (version "1" 表示 v2，其他表示 v3)
      let barcodeBytes: number[];
      if (offlineParams.version === '1') {
        barcodeBytes = [2, ...Array.from(qrDataBytes), 0];
      } else {
        barcodeBytes = [3, ...Array.from(qrDataBytes), 0];
      }
      barcodeBytes.push(...[0, 0, 0, 0]);

      // 转换为字符串
      const barcodeString = String.fromCharCode(...barcodeBytes);
      return barcodeString;
    } catch (error) {
      console.error('二维码生成失败:', error);
      throw error;
    }
  }

  // 生成 headerBytes
  #generateHeaderBytes(offlineParams: OfflineCodeParams): string {
    // 计算 totalLength
    const version = offlineParams.version || '3';
    const offlineUserData = offlineParams.offline_userdata || '';
    const totalLength = version === '1' ? 13 + offlineUserData.length / 2 : 13 + offlineUserData.length / 2 + 1;

    // 生成 headerBytes
    const currentBarcode = '00000000000000000000';
    const headerBytes = new Array(33);
    for (let i = 0; i < currentBarcode.length; i++) {
      headerBytes[i] = currentBarcode.charCodeAt(i);
    }
    headerBytes[20] = 83;
    headerBytes[21] = version === '1' ? 79 : 80; // v2 是 79，v3 是 80
    headerBytes[22] = Math.floor(totalLength / 256);
    headerBytes[23] = Math.floor(totalLength % 256);
    headerBytes[24] = parseInt(version, 10);
    headerBytes[25] = offlineParams.currentCount || 0;
    const timestamp = Math.floor(Date.now() / 1000);
    // eslint-disable-next-line no-bitwise
    headerBytes[26] = timestamp & 255;
    // eslint-disable-next-line no-bitwise
    headerBytes[27] = (timestamp >> 8) & 255;
    // eslint-disable-next-line no-bitwise
    headerBytes[28] = (timestamp >> 16) & 255;
    // eslint-disable-next-line no-bitwise
    headerBytes[29] = (timestamp >> 24) & 255;
    headerBytes[30] = 1;
    headerBytes[31] = parseInt(offlineParams.offline_effective_time, 10) || 0;
    headerBytes[32] = 1; // statusFlag 固定为 1

    let headerHex = '';
    for (let i = 0; i < headerBytes.length; i++) {
      if (headerBytes[i] !== undefined) {
        headerHex += headerBytes[i].toString(16).padStart(2, '0');
      }
    }
    return headerHex.toUpperCase().substring(48);
  }
}
