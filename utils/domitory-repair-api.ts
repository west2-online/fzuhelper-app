import { RejectEnum } from '@/api/enum';
import { LEARNING_CENTER_TOKEN_KEY } from '@/lib/constants';
import { get, postJSON } from '@/modules/native-request';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

// 报修记录的数据类型
export interface fetchAppointmentsData {
  BSLYY_DISPLAY: string;
  BXBM: string;
  BXR: string;
  BXSJ: string;
  BXXN_DISPLAY: string;
  BXZT: string;
  BXZT_DISPLAY: string;
  GZDD: string;
  GZMS: string;
  GZTP: string;
  PF: string;
  PJNR: string;
  PJNR_DISPLAY: string;
  PJSJ: string;
  QYDM: string;
  SJH: string;
  SJLY: string;
  SLR: string;
  SLSJ: string;
  TBR: string;
  WCSJ: string;
  WGTP: string;
  WID: string;
  WXRY: string;
  XMDM: string;
  XMDM_DISPLAY: string;
  XQDM: string;
  XQDM_DISPLAY: string;
}

class ApiService {
  token: string;
  constructor(token: string) {
    this.token = token;
  }

  baseUrl = 'http://ehall.fzu.edu.cn/ssfw/sys';

  // 公共请求方法，使用 Native-Request 模块
  async #request(
    method: 'GET' | 'POST',
    url: string,
    headers: Record<string, string> = {},
    formData: Record<string, string> = {},
  ) {
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

    // token 过期时会返回 500，直接在这个 request 里处理即可
    if (response.status === 500) {
      toast.error('登录状态已过期，请重新登录');
      await AsyncStorage.removeItem(LEARNING_CENTER_TOKEN_KEY);
      router.replace('/(guest)/sso-login');
    }

    try {
      if (response.data === null) {
        console.error('请求结果为空');
        throw {
          type: RejectEnum.NativeLoginFailed,
          data: '请求结果为空',
        };
      }
      const result = Buffer.from(response.data).toString('utf-8');
      console.log('请求结果:', result);
      const data = JSON.parse(result);
      return data;
    } catch (error: any) {
      console.error('解析错误:', error);
      throw error;
    }
  }
  // get请求, 但是未用到
  async #get({ url, headers = {} }: { url: string; headers?: Record<string, string> }) {
    return this.#request('GET', url, headers);
  }

  // post请求, 统一在header加上token
  async #post({
    url,
    headers = {},
    formData = {},
  }: {
    url: string;
    headers?: Record<string, string>;
    formData?: Record<string, string>;
  }) {
    if (!this.token) {
      console.error('无效的token');
    }
    return this.#request('POST', url, { ...headers, token: this.token }, formData);
  }
}
export default ApiService;
