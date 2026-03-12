import { getApiV1JwchUserInfo } from '@/api/generate/user';
import { get } from '@/modules/native-request';
import { UserInfo } from '@/types/user';
import { ensureDir } from '@/utils/file-cache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as fetchNetInfo } from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { consoleTransport, fileAsyncTransport, logger } from 'react-native-logs';
import { LocalUser } from './user';
export class FeedbackManager {
  private static instance: FeedbackManager;

  public static getInstance(): FeedbackManager {
    if (!FeedbackManager.instance) {
      FeedbackManager.instance = new FeedbackManager();
    }
    return FeedbackManager.instance;
  }
  // -----------------------------个人信息-----------------------------

  getStuId = (): string => {
    return LocalUser.getUser().userid;
  };

  #getUserInfo = async (): Promise<UserInfo | undefined> => {
    try {
      const userInfo = await getApiV1JwchUserInfo();
      return userInfo?.data?.data || undefined;
    } catch (error) {
      console.error('getUserInfo error:', error);
      return undefined;
    }
  };

  getStuName = async (): Promise<string> => {
    const userInfo = await this.#getUserInfo();
    return userInfo?.name || '';
  };

  getStuCollege = async (): Promise<string> => {
    const userInfo = await this.#getUserInfo();
    return userInfo?.college || '';
  };

  // -----------------------------设备信息-----------------------------

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
    try {
      const resp = await get('https://info.fzu.edu.cn/', {});
      return resp.status === 200;
    } catch (error) {
      console.error('getNetworkIsCampus error:', error);
      return false;
    }
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

  // -----------------------------版本信息-----------------------------

  APP_VERSION_HISTORY_KEY = 'app_version_history';

  getAppVersion = (): string => {
    return DeviceInfo.getVersion() + ' (' + DeviceInfo.getBuildNumber() + ')';
  };

  addAppVersionHistory = async (): Promise<void> => {
    try {
      const versionHistory = await AsyncStorage.getItem(this.APP_VERSION_HISTORY_KEY);
      // [version1, version2, version3], 最新的在前面，最多记录10个
      const versionHistoryList = JSON.parse(versionHistory || '[]') as string[];
      if (versionHistoryList.length > 0 && versionHistoryList[0] === this.getAppVersion()) {
        return;
      }
      if (versionHistoryList.length >= 10) {
        versionHistoryList.pop();
      }
      versionHistoryList.unshift(this.getAppVersion());
      await AsyncStorage.setItem(this.APP_VERSION_HISTORY_KEY, JSON.stringify(versionHistoryList));
    } catch (error) {
      console.error('addAppVersionHistory error:', error);
      await AsyncStorage.setItem(this.APP_VERSION_HISTORY_KEY, JSON.stringify([this.getAppVersion()]));
    }
  };

  getAppVersionHistory = async (): Promise<string> => {
    const versionHistory = await AsyncStorage.getItem(this.APP_VERSION_HISTORY_KEY);
    return versionHistory || '[]';
  };

  // -----------------------------日志-----------------------------

  private isLoggerInitialized = false;

  initLogger = async (): Promise<void> => {
    if (this.isLoggerInitialized || __DEV__) return; // 调试下日志直接输出到控制台
    const logDir = FileSystem.documentDirectory + 'app_logs/';
    await ensureDir(logDir);
    const log = logger.createLogger({
      transport: fileAsyncTransport,
      transportOptions: {
        FS: FileSystem,
        fileName: '{date-today}.log',
        fileNameDateType: 'iso',
        filePath: logDir,
      },
    });
    log.patchConsole();
    log.info('Logger initialized');
    this.isLoggerInitialized = true;
  };
}
