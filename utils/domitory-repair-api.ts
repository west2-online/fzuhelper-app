// 暂时无用，只实现了历史记录的接口，目前使用带ssoCookie的webview打开报修页面

import { RejectEnum } from '@/api/enum';
import { get, post } from '@/modules/native-request';
import { Buffer } from 'buffer';
import dayjs from 'dayjs';

// 报修记录的数据类型
export interface RepairHistoryData {
  BSLYY_DISPLAY: string;
  BXBM: string; //未知 一串id
  BXR: string; //报修人的学号
  BXSJ: string; //报修时间
  BXXN_DISPLAY: string;
  BXZT: string; //报修状态
  BXZT_DISPLAY: string; //报修状态的文字描述
  GZDD: string; //故障地点
  GZMS: string; //故障描述
  GZTP: string; //故障图片(未知id)
  PF: string;
  PJNR: string;
  PJNR_DISPLAY: string;
  PJSJ: string;
  QYDM: string; //区域代码 八号楼: 8
  SJH: string; //手机号
  SJLY: string; //未知，可能是数据来源
  SLR: string; //未知，可能是受理人
  SLSJ: string; //受理时间 2024-8-24 22:28:28
  TBR: string; //填报人(学号)
  WCSJ: string; //完成时间 2024-08-26 21:26:58
  WGTP: string; //完工图片(未知id)
  WID: string; //未知 一串id
  WXRY: string; //维修人员(id)
  XMDM: string; //项目代码(id)
  XMDM_DISPLAY: string; //项目代码的文字描述
  XQDM: string; //校区代码
  XQDM_DISPLAY: string; //校区代码的文字描述
}

class ApiService {
  cookie: string;
  constructor(cookie: string) {
    this.cookie = cookie;
  }

  baseUrl = 'http://ehall.fzu.edu.cn/ssfw/sys';

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

  // get请求, 但是未用到
  async #get({ url, headers = {} }: { url: string; headers?: Record<string, string> }) {
    return this.#request('GET', url, headers);
  }

  // post请求, 统一在header加上cookie
  async #post({
    url,
    headers = {},
    formData = {},
  }: {
    url: string;
    headers?: Record<string, string>;
    formData?: Record<string, string>;
  }) {
    if (!this.cookie) {
      console.error('无效的cookie');
    }

    const resp = await this.#request(
      'POST',
      url,
      { ...headers, Cookie: this.cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
      formData,
    );

    const result = Buffer.from(resp.data).toString('utf-8');
    const data = JSON.parse(result);
    return data;
  }

  // 获取报修记录
  async fetchRepairHistory(): Promise<RepairHistoryData[]> {
    const resp = await this.#post({
      url: `${this.baseUrl}/swmssbxapp/MyRepairController/getUsrRepairRecords.do`,
      formData: {
        data: '{"querySetting":"[]"}',
      },
    });
    console.log('获取报修记录:', resp);
    if (resp.code !== 0) {
      throw new Error(`获取报修记录失败${resp.code} ${resp.msg}`);
    }
    return resp.data as RepairHistoryData[];
  }
}
export default ApiService;
