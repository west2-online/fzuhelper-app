import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SeatMappingUtil } from './seat-mapping';

class ApiService {
  private static readonly baseUrl = 'https://aiot.fzu.edu.cn/api/ibs';

  // 预约历史
  static async fetchAppointments({
    currentPage,
    pageSize,
    auditStatus,
  }: {
    currentPage: number;
    pageSize: number;
    auditStatus?: string;
  }): Promise<Record<string, any>> {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      throw new Error('Token invalid, please login again');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/spaceAppoint/app/queryMyAppoint`,
        {
          currentPage,
          pageSize,
          auditStatus,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            token,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }
  }

  // 签到
  // 以下是直接发送请求进行一键签到，但不直接提供
  // 对于现场二维码的内容示例是 seatSignInCode@2025-02-22 20:04:10@2025-02-22 20:05:10
  // 二维码每分钟改变一次，前面的时间与后面的时间间隔为一分钟
  // 如果当前的时间在二维码的时间范围内，就可以签到
  static async signIn(appointmentId: string): Promise<Record<string, any>> {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      throw new Error('Token invalid, please login again');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/station/app/signIn`,
        { id: appointmentId },
        {
          headers: {
            'Content-Type': 'application/json',
            token,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Sign in failed: ${error.message}`);
    }
  }

  // 签退
  static async signOut(appointmentId: string): Promise<Record<string, any>> {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      throw new Error('Token invalid, please login again');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/station/app/signOut`,
        { id: appointmentId },
        {
          headers: {
            'Content-Type': 'application/json',
            token,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  // 取消预约
  static async cancelAppointment(appointmentId: string | number): Promise<Record<string, any>> {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      throw new Error('Token invalid, please login again');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/spaceAppoint/app/revocationAppointApp`,
        { id: appointmentId },
        {
          headers: {
            'Content-Type': 'application/json',
            token,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Cancel appointment failed: ${error.message}`);
    }
  }

  // 预约
  // 预约要提供的是 spaceId, 但是我们平时所用的是 spaceName
  // 所以需要先通过 spaceName 获取 spaceId
  static async makeAppointment({
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
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      throw new Error('Token invalid, please login again');
    }

    // 初始化座位映射并获取spaceId
    await SeatMappingUtil.initialize();
    const spaceId = SeatMappingUtil.convertSeatNameToId(spaceName);

    if (!spaceId) {
      throw new Error('Invalid seat name, could not find corresponding ID');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/spaceAppoint/app/addSpaceAppoint`,
        {
          spaceId,
          beginTime,
          endTime,
          date,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            token,
          },
        },
      );

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
            errorMessage = '该座位已被预约，请选择其他座位';
            break;
          case '预约时间不合理,请重新选择!':
            errorMessage = '预约时间超过4.5小时，请重新选择';
            break;
          case '系统异常':
            errorMessage = '结束时间小于开始时间，请检查时间设置';
            break;
          case '时间格式不正确':
            errorMessage = '时间必须是整点或半点，请重新选择';
            break;
          case '预约空间不存在!':
            errorMessage = '座位不存在，请检查座位号';
            break;
          default:
            errorMessage = `预约失败: ${msg}`;
        }

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(`预约失败: ${error.response.data?.msg || error.message}`);
      }
      throw new Error(`预约失败: ${error.message}`);
    }
  }
}

export default ApiService;
