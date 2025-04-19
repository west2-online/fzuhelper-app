import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AlertButton } from 'react-native';
import { COMMON_SETTINGS_KEY } from '../types/constants';

// 通用设置类型定义
export type CommonSettings = {
  ignoredAlerts: {
    [key: string]: boolean; // 键是alert的唯一标识符，值为true表示忽略该提示
  };
};

// 默认的通用设置
const DEFAULT_COMMON_SETTINGS: CommonSettings = {
  ignoredAlerts: {},
};

// 通用设置管理器
export const CommonSettingsManager = {
  // 获取当前设置
  async getSettings(): Promise<CommonSettings> {
    try {
      const settingsStr = await AsyncStorage.getItem(COMMON_SETTINGS_KEY);
      if (!settingsStr) {
        return DEFAULT_COMMON_SETTINGS;
      }
      return JSON.parse(settingsStr);
    } catch (error) {
      console.error('获取通用设置失败:', error);
      return DEFAULT_COMMON_SETTINGS;
    }
  },

  // 保存设置
  async saveSettings(settings: CommonSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(COMMON_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('保存通用设置失败:', error);
    }
  },

  // 检查某个提示是否被忽略
  async isAlertIgnored(alertId: string): Promise<boolean> {
    const settings = await this.getSettings();
    return !!settings.ignoredAlerts[alertId];
  },

  // 设置某个提示是否被忽略
  async setAlertIgnored(alertId: string, ignored: boolean): Promise<void> {
    const settings = await this.getSettings();
    settings.ignoredAlerts[alertId] = ignored;
    await this.saveSettings(settings);
  },

  // 重置所有被忽略的提示
  async resetAllIgnoredAlerts(): Promise<void> {
    const settings = await this.getSettings();
    settings.ignoredAlerts = {};
    await this.saveSettings(settings);
  },
};

// 显示可忽略的提示弹窗
export async function showIgnorableAlert(
  alertId: string,
  title: string,
  message: string,
  actionOnIgnore: () => void,
  buttons?: AlertButton[],
  options?: any,
): Promise<void> {
  // 检查该提示是否被忽略
  const isIgnored = await CommonSettingsManager.isAlertIgnored(alertId);

  if (isIgnored) {
    // 如果已被忽略，直接执行默认操作
    actionOnIgnore();
    return;
  }

  // 准备按钮
  const normalButtons = buttons || [];

  // 添加"不再提示"按钮
  const ignoreButton: AlertButton = {
    text: '不再提示并打开',
    onPress: async () => {
      await CommonSettingsManager.setAlertIgnored(alertId, true);
      actionOnIgnore(); // 勾选"不再提示"后立即执行默认操作
    },
  };

  // 组合所有按钮
  const allButtons = [...normalButtons, ignoreButton];

  // 显示提示
  Alert.alert(title, message, allButtons, options);
}
