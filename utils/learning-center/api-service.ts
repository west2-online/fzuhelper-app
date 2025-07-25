import { RejectEnum } from '@/api/enum';
import { LEARNING_CENTER_TOKEN_KEY } from '@/lib/constants';
import { get, postJSON } from '@/modules/native-request';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { router } from 'expo-router';
import { toast } from 'sonner-native';
import { SeatMappingUtil } from './seat-mapping';

// 预约历史的数据类型
export interface fetchAppointmentsData {
  applyHandset: null;
  applyTime: null;
  applyUser: string;
  appointmentType: number;
  auditMemo: null;
  auditStatus: number;
  auditTime: string;
  auditUser: null;
  beginTime: string;
  campusNumber: string;
  date: string;
  endAppointmentTime: string;
  endTime: string;
  floor: number;
  id: number;
  ids: null;
  isUpdate: null;
  memo: null;
  oldId: null;
  parentId: null;
  planUrl: null;
  region: string;
  regionName: string;
  remark: null;
  seatCode: string;
  seatNumber: null;
  seatSum: null;
  sign: false;
  signOut: null;
  spaceId: number;
  spaceName: string;
  spaceType: number;
  userName: string;
}
// 签到
export interface SignInData {
  code: string;
  currentPage: null;
  data: null;
  dataList: null;
  msg: string;
  otherData: null;
  pageIndex: null;
  pageSize: null;
  total: null;
}
// 签退
export interface SignOutData {
  code: string;
  currentPage: null;
  data: null;
  dataList: null;
  msg: string;
  otherData: null;
  pageIndex: null;
  pageSize: null;
  total: null;
}
// 取消预约的数据类型
export interface cancelAppointmentData {
  code: string;
  currentPage: null;
  data: null;
  dataList: null;
  msg: string;
  otherData: null;
  pageIndex: null;
  pageSize: null;
  total: null;
}
// 查询座位状态
export interface SeatStatusData {
  alwaysDevice: null;
  appoint: null;
  appointmentType: null;
  auditRole: null;
  automatic: null;
  capacity: null;
  close: null;
  defaultNum: null;
  device: null;
  deviceCode: null;
  deviceId: null;
  deviceList: null;
  doorId: null;
  floor: string;
  forbidTimeBegin: null;
  forbidTimeEnd: null;
  future: null;
  id: number;
  open: string;
  otherDevice: null;
  parentId: null;
  plan: null;
  planUrl: null;
  qrcode: null;
  region: number;
  regionName: string;
  role: null;
  seatCode: null;
  seatSum: null;
  seatVoList: null;
  spaceCode: string;
  spaceName: string;
  spaceStatus: number; // 0: 空闲, 1: 预约中, 2: 使用中
  spaceType: null;
  total: null;
}
// 预约结果的数据类型
export interface AppointmentResultData {
  code: string;
  currentPage: null;
  data: null;
  dataList: null;
  msg: string;
  otherData: null;
  pageIndex: null;
  pageSize: null;
  total: null;
}

// 座位时间段可用状态的数据类型
export interface TimeDiamond {
  index: number;
  timeText: string;
  occupy: number; // 0: 未占用, 1: 已占用
  isChecked: boolean;
}

export interface SeatTimeStatusData {
  data: {
    spaceId: number;
    date: string;
    timeDiamondList: TimeDiamond[];
  };
  code: string;
  msg: string;
  dataList: null;
  pageIndex: null;
  pageSize: null;
  currentPage: null;
  total: null;
  otherData: null;
}

class ApiService {
  token: string;
  constructor(token: string) {
    this.token = token;
  }

  baseUrl = 'https://aiot.fzu.edu.cn/api/ibs';

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
      'User-Agent':
        'Mozilla/5.0 (iPad; CPU OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 appId/cn.edu.fzu.fdxypa appScheme/kysk-fdxy-app hengfeng/fdxyappzs appType/2 ruijie-facecamera',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      Referer: 'https://aiot.fzu.edu.cn/ibs/',
      Origin: 'https://aiot.fzu.edu.cn',
      Connection: 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
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

  // 预约历史
  async fetchAppointments({
    currentPage,
    pageSize,
    auditStatus,
  }: {
    currentPage: number;
    pageSize: number;
    auditStatus?: string;
  }): Promise<fetchAppointmentsData[]> {
    /**
     * @parm currentPage 当前页码
     * @parm pageSize 每页显示数量
     * @parm auditStatus 审核状态
     * @return 预约历史列表
     */
    const data = await this.#post({
      url: `${this.baseUrl}/spaceAppoint/app/queryMyAppoint`,
      formData: {
        currentPage: currentPage.toString(),
        pageSize: pageSize.toString(),
        auditStatus: auditStatus || '',
      },
    });
    console.log('预约历史:', data);
    switch (data.code) {
      case '0':
        return data.dataList as fetchAppointmentsData[];
      case '403':
        throw new Error('刷新过快，请稍等3分钟后重试');
      default:
        throw new Error(`获取预约历史失败: ${data.msg}`);
    }
  }

  // 签到
  // 以下是直接发送请求进行一键签到，但不直接提供
  // 对于现场二维码的内容示例是 seatSignInCode@2025-02-22 20:04:10@2025-02-22 20:05:10
  // 二维码每分钟改变一次，前面的时间与后面的时间间隔为一分钟
  // 如果当前的时间在二维码的时间范围内，就可以签到
  async signIn(appointmentId: string): Promise<SignInData> {
    /**
     *
     * @param appointmentId 预约ID
     * @return SignInData 签到结果
     */
    const data: SignInData = await this.#post({
      url: `${this.baseUrl}/station/app/signIn`,
      formData: { id: appointmentId },
    });

    console.log('签到结果:', data);
    if (data.code === '0') {
      return data;
    }

    throw new Error(`${data.code} : ${data.msg}`);
  }

  // 签退
  async signOut(appointmentId: string): Promise<SignOutData> {
    /**
     * @param appointmentId 预约ID
     * @return SignOutData 签退结果
     */

    const data: SignOutData = await this.#post({
      url: `${this.baseUrl}/station/app/signOut`,
      formData: { id: appointmentId },
    });
    console.log('签退结果:', data);
    if (data.code === '0') {
      return data;
    }
    throw new Error(`${data.code} : ${data.msg}`);
  }

  // 取消预约
  async cancelAppointment(appointmentId: string): Promise<cancelAppointmentData> {
    /**
     * @param appointmentId 预约ID
     * @return cancelAppointmentData 取消预约结果
     */
    const data: cancelAppointmentData = await this.#post({
      url: `${this.baseUrl}/spaceAppoint/app/revocationAppointApp`,
      formData: { id: appointmentId },
    });

    console.log('取消预约结果:', data);
    if (data.code === '0') {
      return data;
    }
    throw new Error(`取消预约失败: ${data.code} ${data.msg}`);
  }

  // 查询座位状态
  async querySeatStatus({
    date,
    beginTime,
    endTime,
    floor,
  }: {
    date: string;
    beginTime: string;
    endTime: string;
    floor: string;
  }): Promise<SeatStatusData[]> {
    /**
     * @param date 日期 格式为 yyyy-MM-dd 如2020-03-01
     * @param beginTime 开始时间 格式为 HH:mm 如 08:00
     * @param endTime 结束时间 格式为 HH:mm 如 08:00
     * @param floor 楼层
     * @return SeatStatusData[] 座位状态列表
     */
    console.log('查询座位状态:', date, beginTime, endTime, floor);
    const data = await this.#post({
      url: `${this.baseUrl}/spaceAppoint/app/queryStationStatusByTime`,
      formData: {
        beginTime: date + ' ' + beginTime, // 拼接日期和时间
        endTime: date + ' ' + endTime, // 拼接日期和时间
        floorLike: floor,
        parentId: 'null',
        region: '1',
      },
    });
    console.log('查询座位', data);

    const { code, dataList, msg } = data;
    if (code === '0') {
      return dataList as SeatStatusData[];
    }
    throw new Error(`查询座位状态失败: ${msg}`);
  }

  // 预约座位
  async makeAppointment({
    spaceName,
    beginTime,
    endTime,
    date,
  }: {
    spaceName: string;
    beginTime: string;
    endTime: string;
    date: string;
  }): Promise<AppointmentResultData> {
    /**
     * @param spaceName 座位号
     * @param date 日期 格式为 yyyy-MM-dd 如2020-03-01
     * @param beginTime 开始时间 格式为 HH:mm 如 08:00
     * @param endTime 结束时间 格式为 HH:mm 如 08:00
     * @return AppointmentResultData 预约结果
     */

    // 初始化座位映射并获取spaceId
    await SeatMappingUtil.initialize();
    const spaceId = SeatMappingUtil.convertSeatNameToId(spaceName);

    if (!spaceId) {
      throw new Error('无效的座位号');
    }

    const data: AppointmentResultData = await this.#post({
      url: `${this.baseUrl}/spaceAppoint/app/addSpaceAppoint`,
      formData: {
        spaceId,
        beginTime,
        endTime,
        date,
      },
    });
    console.log('预约结果:', data);
    const { code, msg } = data;

    if (code === '0') {
      return data;
    } else {
      switch (msg) {
        case '成功':
          return data;
        case '所选空间已被预约，请重新选择!':
          throw new Error('该座位已被预约，请选择其他座位');
        case '预约时间不合理,请重新选择!':
          throw new Error('预约时间超过4.5小时，请重新选择');
        case '系统异常':
          throw new Error('结束时间小于开始时间，请检查时间设置');
        case '时间格式不正确':
          throw new Error('时间必须是整点或半点，请重新选择');
        case '预约空间不存在!':
          throw new Error('座位不存在，请检查座位号');
        default:
          throw new Error(`${msg}`);
      }
    }
  }

  // 查询座位时间段可用状态
  async querySpaceAppointTime({ spaceId, date }: { spaceId: string; date: string }): Promise<SeatTimeStatusData> {
    /**
     * @param spaceId 座位ID
     * @param date 日期 格式为 yyyy-MM-dd 如2020-03-01
     * @return SeatTimeStatusData 座位时间段可用状态
     */
    console.log('查询座位时段:', spaceId, date);
    const data = await this.#post({
      url: `${this.baseUrl}/spaceAppoint/app/querySpaceAppointTime`,
      formData: {
        spaceId,
        date,
      },
    });
    console.log('查询座位时段结果:', data);

    const { code, msg } = data;
    if (code === '0') {
      return data as SeatTimeStatusData;
    }
    throw new Error(`查询座位时段失败: ${msg}`);
  }
}
export default ApiService;
