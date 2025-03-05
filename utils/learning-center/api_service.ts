import { RejectEnum } from '@/api/enum';
import { LEARNING_CENTER_TOKEN_KEY } from '@/lib/constants';
import { get, postJSON } from '@/modules/native-request';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Buffer } from 'buffer';
import { SeatMappingUtil } from './seat-mapping';

export interface SeatModel {
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
class ApiService {
  baseUrl = 'https://aiot.fzu.edu.cn/api/ibs';
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

      return jsonData;
    } catch (error) {
      console.error('请求错误:', error);
      throw error;
    }
  }
  // get请求
  async #get({ url, headers = {} }: { url: string; headers?: Record<string, string> }) {
    return this.#request('GET', url, headers);
  }

  // post请求,统一在header加上token
  async #post({
    url,
    headers = {},
    formData = {},
  }: {
    url: string;
    headers?: Record<string, string>;
    formData?: Record<string, string>;
  }) {
    const token = await AsyncStorage.getItem(LEARNING_CENTER_TOKEN_KEY);
    if (!token) {
      throw new Error('Token invalid, please login again');
    }
    return this.#request('POST', url, { ...headers, token }, formData);
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
  }): Promise<SeatModel[]> {
    /**
     * @parm currentPage 当前页码
     * @parm pageSize 每页显示数量
     * @parm auditStatus 审核状态
     * @return 预约历史列表
     */
    try {
      const resp = await this.#post({
        url: `${this.baseUrl}/spaceAppoint/app/queryMyAppoint`,
        formData: {
          currentPage: currentPage.toString(),
          pageSize: pageSize.toString(),
          auditStatus: auditStatus || '',
        },
      });
      //检查状态码是否为成功
      if (resp.code === '0') {
        return resp.dataList as SeatModel[];
      }
      throw new Error(`获取预约历史失败:${resp.code}: ${resp.msg}`);
    } catch (error: any) {
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }
  }

  // 签到
  // 以下是直接发送请求进行一键签到，但不直接提供
  // 对于现场二维码的内容示例是 seatSignInCode@2025-02-22 20:04:10@2025-02-22 20:05:10
  // 二维码每分钟改变一次，前面的时间与后面的时间间隔为一分钟
  // 如果当前的时间在二维码的时间范围内，就可以签到
  async signIn(appointmentId: string): Promise<Record<string, any>> {
    try {
      const resp = await this.#post({
        url: `${this.baseUrl}/station/app/signIn`,
        formData: { id: appointmentId },
      });
      console.log('签到结果:', resp);
      if (resp.code === '0') {
        return resp.dataList;
      }
      throw new Error(`Sign in failed: ${resp.code} ${resp.msg}`);
    } catch (error: any) {
      throw new Error(`Sign in failed: ${error.message}`);
    }
  }
  // 签退
  async signOut(appointmentId: string): Promise<Record<string, any>> {
    try {
      const resp = await this.#post({
        url: `${this.baseUrl}/station/app/signOut`,
        formData: { id: appointmentId },
      });
      console.log('签退结果:', resp);
      if (resp.code === '0') {
        return resp.dataList;
      }
      throw new Error(`Sign out failed: ${resp.code} ${resp.msg}`);
    } catch (error: any) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }
  // 取消预约
  async cancelAppointment(appointmentId: string): Promise<Record<string, any>> {
    try {
      const resp = await this.#post({
        url: `${this.baseUrl}/spaceAppoint/app/revocationAppointApp`,
        formData: { id: appointmentId },
      });
      console.log('取消预约结果:', resp);
      if (resp.code === '0') {
        return resp.dataList;
      }
      throw new Error(`Cancel appointment failed: ${resp.code} ${resp.msg}`);
    } catch (error: any) {
      throw new Error(`Cancel appointment failed: ${error.message}`);
    }
  }
  // 查询座位状态
  async querySeatStatus({ beginTime, endTime, floor }: { beginTime: string; endTime: string; floor: string }): Promise<{
    success: boolean;
    message: string;
    data: SeatModel[] | null;
  }> {
    try {
      // console.log(`查询座位状态参数: beginTime=${beginTime}, endTime=${endTime}, floor=${floor}`);

      // const response = await axios.post(`${this.baseUrl}/spaceAppoint/app/queryStationStatusByTime`, {
      //   beginTime,
      //   endTime,
      //   floorLike: floor,
      //   parentId: null,
      //   region: 1,
      // });
      const response = await this.#post({
        url: `${this.baseUrl}/spaceAppoint/app/queryStationStatusByTime`,
        formData: {
          beginTime,
          endTime,
          floorLike: floor,
          parentId: 'null',
          region: '1',
        },
      });
      console.log(response);
      const { code, dataList, msg } = response;
      console.log(`${floor}楼座位状态查询结果: code=${code}, msg=${msg}, 数据条数=${dataList?.length || 0}`);
      // 如果code为0，说明查询成功
      if (code === '0') {
        const seats = dataList
          ? dataList
              .filter((item: any) => !item.spaceName.toString().includes('-'))
              .map((item: any) => ({
                id: item.id,
                spaceName: item.spaceName,
                spaceId: item.id.toString(), // 使用 id 作为 spaceId
                status: item.spaceStatus, // 使用 spaceStatus 字段
              }))
          : [];
        console.log(`${floor}楼查询成功，处理后获取到${seats.length}个座位`);
        return { success: true, message: msg || '查询成功', data: seats };
      }

      return { success: false, message: msg || '查询失败', data: null };
    } catch (error: any) {
      console.error(`${floor}楼查询座位状态错误:`, error);
      return {
        success: false,
        message: `查询座位状态失败: ${error.message}`,
        data: null,
      };
    }
  }
  // 查询所有楼层座位
  async queryAllFloorSeats({
    date,
    beginTime,
    endTime,
  }: {
    date: string;
    beginTime: string;
    endTime: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: SeatModel[] | null;
  }> {
    try {
      console.log(`查询所有座位参数: date=${date}, beginTime=${beginTime}, endTime=${endTime}`);

      // 存储所有座位
      const allSeats: SeatModel[] = [];

      // 构建完整的日期时间字符串
      const formattedBeginTime = `${date} ${beginTime}`;
      const formattedEndTime = `${date} ${endTime}`;

      console.log(`格式化后的时间: begin=${formattedBeginTime}, end=${formattedEndTime}`);
      // 循环查询4楼和5楼的座位
      // TODO: 四楼和五楼并发处理
      for (const floor of ['4', '5']) {
        console.log(`开始查询${floor}楼座位`);

        const result = await this.querySeatStatus({
          beginTime: formattedBeginTime,
          endTime: formattedEndTime,
          floor,
        });
        // 如果查询成功，将座位添加到allSeats中
        if (result.success) {
          const seatsCount = result.data?.length || 0;
          console.log(`${floor}楼查询成功，添加${seatsCount}个座位`);

          if (result.data && result.data.length > 0) {
            allSeats.push(...result.data);
          }
        } else {
          console.log(`${floor}楼查询失败: ${result.message}`);
        }
      }

      console.log(`总共获取到${allSeats.length}个座位`);

      // 按座位号排序
      if (allSeats.length > 0) {
        allSeats.sort((a, b) => parseInt(a.spaceName, 10) - parseInt(b.spaceName, 10));
        return { success: true, message: '查询成功', data: allSeats };
      } else {
        // 如果两个楼层都查询成功但都没有座位，我们也应当认为这是成功的查询，只是结果为空
        return {
          success: true,
          message: '查询成功，但未找到可用座位',
          data: [],
        };
      }
    } catch (error: any) {
      console.error('查询所有楼层座位错误:', error);
      return {
        success: false,
        message: `查询座位失败: ${error.message}`,
        data: null,
      };
    }
  }
  // 预约
  // 预约要提供的是 spaceId, 但是我们平时所用的是 spaceName
  // 所以需要先通过 spaceName 获取 spaceId
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
  }): Promise<Record<string, any>> {
    // 初始化座位映射并获取spaceId
    await SeatMappingUtil.initialize();
    const spaceId = SeatMappingUtil.convertSeatNameToId(spaceName);

    if (!spaceId) {
      throw new Error('Invalid seat name, could not find corresponding ID');
    }

    try {
      const response = await this.#post({
        url: `${this.baseUrl}/spaceAppoint/app/addSpaceAppoint`,
        formData: {
          spaceId,
          beginTime,
          endTime,
          date,
        },
      });
      console.log('预约结果:', response);
      const { code, msg } = response.data;

      if (code === 0) {
        return response.data;
      } else {
        // 处理各种错误情况
        let errorMessage: string;
        switch (msg) {
          case '成功':
            return response.data;
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
            throw new Error(`预约失败: ${msg}`);
        }
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(`预约失败: ${error.response.data?.msg || error.message}`);
      }
      throw error;
    }
  }
}
export default ApiService;
