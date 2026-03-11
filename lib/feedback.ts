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

  /**
   * 获取操作系统版本
   * @returns Android: 16 (36), iOS: 26.0
   */
  getOsVersion = (): string => {
    if (Platform.OS === 'android') {
      return DeviceInfo.getSystemVersion() + ' (' + String(Platform.Version) + ')';
    } else {
      return DeviceInfo.getSystemVersion();
    }
  };

  /**
   * 获取制造商（品牌）
   * @returns Manufacturer (Brand) if Manufacturer is not equal to Brand
   */
  getManufacturer = async (): Promise<string> => {
    const brand = DeviceInfo.getBrand();
    const manufacturer = await DeviceInfo.getManufacturer();
    if (manufacturer === brand) {
      return manufacturer;
    } else {
      return manufacturer + ' (' + brand + ')';
    }
  };

  /**
   * 获取设备Model，对于iOS是设备传播名
   * @returns 例如 Android: 22041211AC（代表红米K50）, iOS: iPhone 17 Pro
   */
  getDeviceModel = (): string => {
    return DeviceInfo.getModel();
  };

  /**
   * 获取设备型号(Device)，非设备传播名
   * @returns 例如 Android: rubens（代表红米K50）, iOS: iPhone18,1（代表iPhone 17 Pro） https://github.com/KHwang9883/MobileModels https://storage.googleapis.com/play_public/supported_devices.csv
   */
  getProduct = async (): Promise<string> => {
    if (Platform.OS === 'ios') {
      return DeviceInfo.getDeviceId();
    } else {
      return await DeviceInfo.getProduct();
    }
  };
}
