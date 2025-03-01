import axios from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Cancel appointment
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
}

export default ApiService;
