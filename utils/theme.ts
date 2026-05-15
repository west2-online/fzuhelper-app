import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { COLOR_SCHEME_KEY, DARKEN_BACKGROUND_KEY } from '@/lib/constants';

export type ThemeSetting = 'light' | 'dark' | 'system';

export const getBackgroundImagePath = (): string => {
  const path = ReactNativeBlobUtil.fs.dirs.DocumentDir + '/background.png';
  if (Platform.OS === 'android') {
    return 'file://' + path;
  }
  return path;
};

export const checkCustomBackground = async (): Promise<boolean> => {
  const path = getBackgroundImagePath();
  return await ReactNativeBlobUtil.fs.exists(path);
};

export const writeBackgroundImageFromPath = async (imagePath: string): Promise<void> => {
  const path = getBackgroundImagePath();
  if (await ReactNativeBlobUtil.fs.exists(path)) {
    await ReactNativeBlobUtil.fs.unlink(path);
  }
  await ReactNativeBlobUtil.fs.cp(imagePath, path);
  // 移除原始临时文件（如果存在），避免占用空间
  try {
    await ReactNativeBlobUtil.fs.unlink(imagePath);
  } catch (e) {
    // 如果原始文件已经被移除或无法访问就忽视
  }
};

export const removeBackgroundImageFile = async (): Promise<void> => {
  const path = getBackgroundImagePath();
  // 在某些平台上，如果文件不存在，调用 unlink（删除文件）会抛出错误。
  try {
    await ReactNativeBlobUtil.fs.unlink(path);
  } catch (e) {
    // 因为函数的目的是确保背景图片文件被移除。如果文件已经不存在了，那本质上目标已经达成了——文件已经被删除了。所以有没有抛错不重要。
  }
};

export const getThemePreference = async (): Promise<ThemeSetting> => {
  const stored = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
};

export const setThemePreference = async (value: ThemeSetting): Promise<void> => {
  await AsyncStorage.setItem(COLOR_SCHEME_KEY, value);
};

export const getDarkenBackground = async (): Promise<boolean> => {
  return (await AsyncStorage.getItem(DARKEN_BACKGROUND_KEY)) === 'true';
};
