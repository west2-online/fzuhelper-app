import { getApiV1JwchUserInfo } from '@/api/generate/user';
import { get } from '@/modules/native-request';
import { UserInfo } from '@/types/user';
import { fetch as fetchNetInfo } from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { LocalUser } from './user';

export class FeedbackManager {
  private userInfo: UserInfo | undefined = undefined;

  getStuId = (): string => {
    return LocalUser.getUser().userid;
  };

  #getUserInfo = async (): Promise<UserInfo> => {
    if (this.userInfo) {
      return this.userInfo;
    }
    const userInfo = await getApiV1JwchUserInfo();
    this.userInfo = userInfo?.data?.data || undefined;
    return this.userInfo;
  };

  getStuName = async (): Promise<string> => {
    const userInfo = await this.#getUserInfo();
    return userInfo?.name || '';
  };

  getStuCollege = async (): Promise<string> => {
    const userInfo = await this.#getUserInfo();
    return userInfo?.college || '';
  };

  /**
   * 获取网络类型
   * @returns wifi, cellular, vpn ..., https://github.com/react-native-netinfo/react-native-netinfo#netinfostatetype
   */
  getNetworkType = async (): Promise<string> => {
    const state = await fetchNetInfo();
    return state.type;
  };

  // 是否在校园网内，如果不是则会302到系统提示页面
  getNetworkIsCampus = async (): Promise<boolean> => {
    const resp = await get('https://info.fzu.edu.cn/', {});
    return resp.status === 200;
  };

  getOsName = (): string => {
    return Platform.OS;
  };

  getOsVersion = (): string => {
    return String(Platform.Version);
  };

  getManufacturer = async (): Promise<string> => {
    return await DeviceInfo.getManufacturer();
  };

  getDeviceModel = (): string => {
    return DeviceInfo.getModel();
  };
}
