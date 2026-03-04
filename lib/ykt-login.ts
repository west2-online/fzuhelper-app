import { RejectEnum } from '@/api/enum';
import { get, postJSON } from '@/modules/native-request';
import { Buffer } from 'buffer';
import forge from 'node-forge';
import SSOLogin from './sso-login';

interface OfflineCodeParams {
  offline_userdata: string; // 十六进制字符串
  userhashkey: string; // 十六进制字符串，RSA加密的对称密钥
  offline_effective_time: string; // 有效时间
  version: string; // 版本号，如 "1" 表示 v2，其他表示 v3
  currentCount: number; // 当前使用次数
  offlineCodeVersion?: string;
}

const YKT_URLS = {
  GET_AUTH:
    'https://xcx.fzu.edu.cn/berserker-auth/cas/login/ruiJie?targetUrl=https%3A%2F%2Fxcx.fzu.edu.cn%2Fberserker-base%2Fredirect%3FappId%3D16%26nodeId%3D15%26type%3Dapp',
  GET_USER_INFO: 'https://xcx.fzu.edu.cn/berserker-base/user?synAccessSource=h5',
  GET_CODEBAR_PAY_INFO: 'https://xcx.fzu.edu.cn/berserker-app/ykt/tsm/codebarPayinfo?synAccessSource=h5',
  GET_BATCH_BARCODE: 'https://xcx.fzu.edu.cn/berserker-app/ykt/tsm/batchGetBarCodeGet',
  GET_OFFLINE_PAY_INFO: 'https://xcx.fzu.edu.cn/berserker-app/ykt/tsm/offlienPar',
  GET_FRONT_INFO: 'https://xcx.fzu.edu.cn/berserker-app/frontInfo?synAccessSource=h5',
  REFERER: 'https://xcx.fzu.edu.cn/plat/pay?appId=16&nodeId=15',
};

const FALLBACK_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBANU64/H2n5i6i2L9
xs7TQ2nC7Oe8S/LkyiumV5YWoOjcbDzJ8Nm9JSBFSt12Y3mDmVT2guP763akpL4P
U9rz30Vt9uL8EnjzGRvhwvIQq1HfI9z8c67GJbL1wOxLFknnXxPPicn7B5/nTN66
zobrhhgbUDUTO4eBZCPryDf9/fJNAgMBAAECgYEAtBN2/BpOsFoiayhtJLBQR1pC
XnasIWZMws5JO8zCecXldvUIfap6VyWN0zgvTCjybkl9QvK26UykgIpLRCcez2Yk
4znIWS4AJb2TvcpbEIRt8mMICGtp9MNe54GieQ9dTQdKY2J4e+zJKHJUgut03M6C
ME8SYss0uu1RksiamGECQQDsm91KWfQEi5bOJJ5ippAYsGyQkByATzRqbGPXPCwZ
1HRBrDMQBjE4u89EwKpb50H6HYbySB/Pqi6VI20Y6ltlAkEA5rSH02LaY3GIb5ih
oD2D7oqbwt3x4bJvJRjq0oFr/tPkTrV9NyrdUcDzSSpJs4TXNwU8oV2+J0cQTwhd
7gBwyQJARmEec81J/kgfNXZC/okY958Sy/Vx5OCqcLWJBS7K12wQoLA+CBgvb/a9
cm/0vJ2PTHyX9V1qyPSQIqCFBRJA2QJAValGnZig2je3nygfKy5sJFBXEX3zaAgm
+LFNz6e6f74RkaAVxDwoPUjVjJ8lCoESoB1Tq97w0giy54WFyu9i8QJAQY/ozmFh
VLYEVJjk/c+KorA3j3Wt94x4SnIcq00Gj8bh8dVGydfPY5lVNLOAjMwofAETTrHV
OxZLn+h28MX9Mg==
-----END PRIVATE KEY-----`;

export default class YKTLogin {
  #decryptUserHashKeyHex(userhashkeyHex: string, privateKeyPem: string): string {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const encryptedBytes = forge.util.hexToBytes(userhashkeyHex);
    const decryptedBytes = privateKey.decrypt(encryptedBytes, 'RSAES-PKCS1-V1_5');
    return forge.util.bytesToHex(decryptedBytes).toUpperCase();
  }

  #padEvenHex(value: string): string {
    return value.length % 2 === 0 ? value : `0${value}`;
  }

  #hexLengthPrefix(valueHex: string): string {
    return this.#padEvenHex((valueHex.length / 2).toString(16).toUpperCase());
  }

  #hexToBytes(hex: string): number[] {
    const normalized = this.#padEvenHex(hex);
    const bytes: number[] = [];
    for (let i = 0; i < normalized.length; i += 2) {
      bytes.push(parseInt(normalized.slice(i, i + 2), 16));
    }
    return bytes;
  }

  #bytesToHex(bytes: number[]): string {
    let hex = '';
    for (let i = 0; i < bytes.length; i += 1) {
      const value = Number(bytes[i] ?? 0);
      const h = value < 0 ? (255 + value + 1).toString(16) : value.toString(16);
      hex += h.length === 1 ? `0${h}` : h;
    }
    return hex.toUpperCase();
  }

  #buildPayAccTag(payacc: string, accountType: string): string {
    let payaccHex = '';
    for (let i = 0; i < payacc.length; i += 1) {
      payaccHex += payacc.charCodeAt(i).toString(16).toUpperCase();
    }
    payaccHex = this.#padEvenHex(payaccHex);

    const tag84 = `84${this.#hexLengthPrefix(payaccHex)}${payaccHex}`;
    const accountTypeHex = this.#padEvenHex(accountType.toUpperCase());
    const tag85 = `85${this.#hexLengthPrefix(accountTypeHex)}${accountTypeHex}`;
    const payload = `${tag84}${tag85}`;

    return `6F${this.#hexLengthPrefix(payload)}${payload}`;
  }

  #sha1HexText(value: string): string {
    const md = forge.md.sha1.create();
    md.update(value, 'utf8');
    return md.digest().toHex().toUpperCase();
  }

  async #getBatchBarcode({
    synjonesAuth,
    account,
    payacc,
    paytype,
  }: {
    synjonesAuth: string;
    account: string;
    payacc: string;
    paytype: string;
  }): Promise<string> {
    const barcodeUrl = `${YKT_URLS.GET_BATCH_BARCODE}?account=${encodeURIComponent(account)}&payacc=${encodeURIComponent(payacc)}&paytype=${encodeURIComponent(paytype)}&synAccessSource=h5`;
    const barcodeResp = await this.#get({
      url: barcodeUrl,
      headers: {
        Referer: YKT_URLS.REFERER,
        Synaccesssource: 'h5',
        'Synjones-Auth': `bearer ${synjonesAuth}`,
      },
    });

    const barcodeList = barcodeResp.data?.barcode;
    const barcode = Array.isArray(barcodeList) ? barcodeList[0] : undefined;
    const digits = typeof barcode === 'string' ? barcode.replace(/\D/g, '') : '';

    if (digits.length < 18) {
      throw {
        type: RejectEnum.BizFailed,
        data: barcodeResp,
      };
    }

    return digits.slice(0, 20);
  }

  #isNewOfflineVersion(offlineParams: OfflineCodeParams): boolean {
    if (offlineParams.offlineCodeVersion !== undefined && offlineParams.offlineCodeVersion !== null) {
      return String(offlineParams.offlineCodeVersion) !== '0';
    }

    return Number(offlineParams.version) >= 3;
  }

  #parseJSONData(data: unknown) {
    if (ArrayBuffer.isView(data)) {
      const view = data as ArrayBufferView;
      const uint8 = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
      const raw = Buffer.from(uint8).toString('utf-8');
      return JSON.parse(raw) as Record<string, any>;
    }

    if (data instanceof ArrayBuffer) {
      const raw = Buffer.from(new Uint8Array(data)).toString('utf-8');
      return JSON.parse(raw) as Record<string, any>;
    }

    if (Array.isArray(data)) {
      const isByteArray = data.every(item => typeof item === 'number');
      if (isByteArray) {
        const raw = Buffer.from(data).toString('utf-8');
        return JSON.parse(raw) as Record<string, any>;
      }
    }

    if (Buffer.isBuffer(data)) {
      return JSON.parse(data.toString('utf-8')) as Record<string, any>;
    }

    if (typeof data === 'string') {
      return JSON.parse(data) as Record<string, any>;
    }

    if (typeof data === 'object' && data !== null) {
      return data as Record<string, any>;
    }

    const raw = String(data ?? '');
    return JSON.parse(raw) as Record<string, any>;
  }

  #normalizePrivateKey(privateKey?: string): string | undefined {
    if (!privateKey) {
      return undefined;
    }

    const trimmed = privateKey.trim();
    if (trimmed.includes('\n')) {
      return trimmed;
    }

    return trimmed
      .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
      .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  }

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

      const jsonData = this.#parseJSONData(response.data);

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
    const payInfo = Array.isArray(codebarResp.data) ? codebarResp.data[0] : undefined;
    if (!payInfo?.account || !payInfo?.payacc || !payInfo?.paytype || !payInfo?.voucher) {
      throw {
        type: RejectEnum.BizFailed,
        data: codebarResp,
      };
    }

    const payacc = payInfo.payacc;
    const paytype = payInfo.paytype;
    const voucher = payInfo.voucher;

    const currentBarcode = await this.#getBatchBarcode({
      synjonesAuth,
      account: payInfo.account,
      payacc,
      paytype,
    });
    console.log('支付信息:', { payacc, paytype, voucher });
    // 获取 offline params
    const offlineUrl = `${YKT_URLS.GET_OFFLINE_PAY_INFO}?payacc=${encodeURIComponent(payacc)}&paytype=${encodeURIComponent(paytype)}&voucher=${encodeURIComponent(voucher)}&synAccessSource=h5`;
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

    const frontConfig =
      typeof frontResp.data?.getFrontConfig === 'string'
        ? JSON.parse(frontResp.data.getFrontConfig)
        : frontResp.data?.getFrontConfig || {};
    const privateKey = this.#normalizePrivateKey(frontConfig.privateKey) || FALLBACK_PRIVATE_KEY;

    // 生成二维码数据
    return this.#generateQRCodeDataString(currentBarcode, payacc, offlineParams, privateKey);
  }

  // 生成二维码数据字符串
  async #generateQRCodeDataString(
    currentBarcode: string,
    payacc: string,
    offlineParams: OfflineCodeParams,
    privateKeyPem: string,
  ): Promise<string> {
    try {
      const hashKeyHex = this.#decryptUserHashKeyHex(offlineParams.userhashkey, privateKeyPem).substring(0, 32);
      const offlineUserDataHex = (offlineParams.offline_userdata || '').toUpperCase();
      const payAccTagHex = this.#buildPayAccTag(payacc, '01');
      const isNewVersion = this.#isNewOfflineVersion(offlineParams);

      const totalLength = isNewVersion
        ? 13 + (offlineUserDataHex.length + payAccTagHex.length) / 2 + 1
        : 13 + offlineUserDataHex.length / 2;

      const headerBytes = this.#generateHeaderBytes(currentBarcode, totalLength, offlineParams, isNewVersion);
      let digestSourceHex = this.#bytesToHex(headerBytes).substring(48);

      let payAccTagLengthHex = '';
      if (isNewVersion) {
        payAccTagLengthHex = this.#padEvenHex((payAccTagHex.length / 2).toString(16).toUpperCase());
        digestSourceHex = `${digestSourceHex}${offlineUserDataHex}${payAccTagLengthHex}${payAccTagHex}${hashKeyHex}`;
      } else {
        digestSourceHex = `${digestSourceHex}${offlineUserDataHex}${hashKeyHex}`;
      }

      const hash8 = this.#sha1HexText(digestSourceHex).substring(0, 8).toUpperCase();
      const payloadHex = isNewVersion
        ? `${offlineUserDataHex}${payAccTagLengthHex}${payAccTagHex}${hash8}`
        : `${offlineUserDataHex}${hash8}`;

      const payloadBytes = this.#hexToBytes(payloadHex);
      const combinedBytes = [...headerBytes, ...payloadBytes];
      const protocolSuffix = `S${String.fromCharCode(isNewVersion ? 80 : 79)}`;

      if (isNewVersion) {
        const encoded = Buffer.from(new Uint8Array(combinedBytes.slice(22))).toString('base64');
        return `${currentBarcode}${protocolSuffix}${encoded}`;
      }

      const rawBytes = combinedBytes.slice(22);
      const rawText = Buffer.from(new Uint8Array(rawBytes)).toString('latin1');
      return `${currentBarcode}${protocolSuffix}${rawText}`;
    } catch (error) {
      console.error('二维码生成失败:', error);
      throw error;
    }
  }

  // 生成 headerBytes
  #generateHeaderBytes(
    currentBarcode: string,
    totalLength: number,
    offlineParams: OfflineCodeParams,
    isNewVersion: boolean,
  ): number[] {
    const version = Number.parseInt(offlineParams.version, 10) || 3;
    const protocolCode = isNewVersion ? 80 : 79;
    const effectiveTime = Number(offlineParams.offline_effective_time) || 0;
    const timestamp = Math.floor(Date.now() / 1000);
    const timestampByte0 = timestamp % 256;
    const timestampByte1 = Math.floor(timestamp / 256) % 256;
    const timestampByte2 = Math.floor(timestamp / 65536) % 256;
    const timestampByte3 = Math.floor(timestamp / 16777216) % 256;
    const currentCountByte = 0;
    const effectiveTimeByte = Math.floor(effectiveTime) % 256;
    const totalLengthByte0 = Math.floor(totalLength / 256) % 256;
    const totalLengthByte1 = totalLength % 256;

    const headerBytes = new Array(33).fill(0);
    for (let i = 0; i < currentBarcode.length && i < 20; i += 1) {
      headerBytes[i] = currentBarcode.charCodeAt(i);
    }

    headerBytes[20] = 83;
    headerBytes[21] = protocolCode;
    headerBytes[22] = totalLengthByte0;
    headerBytes[23] = totalLengthByte1;
    headerBytes[24] = version;
    headerBytes[25] = currentCountByte;
    headerBytes[26] = timestampByte0;
    headerBytes[27] = timestampByte1;
    headerBytes[28] = timestampByte2;
    headerBytes[29] = timestampByte3;
    headerBytes[30] = 1;
    headerBytes[31] = effectiveTimeByte;
    headerBytes[32] = 1;

    return headerBytes;
  }
}
