import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';

import { DARKEN_BACKGROUND_KEY, COLOR_SCHEME_KEY } from '@/lib/constants';

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
  // remove the original temporary file if exists
  try {
    await ReactNativeBlobUtil.fs.unlink(imagePath);
  } catch (e) {
    // ignore if original file already removed or unaccessible
  }
};

export const removeBackgroundImageFile = async (): Promise<void> => {
  const path = getBackgroundImagePath();
  // unlink will throw if not exists on some platforms, but that's ok
  try {
    await ReactNativeBlobUtil.fs.unlink(path);
  } catch (e) {
    // ignore
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
