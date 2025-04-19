import { COLOR_SCHEME_KEY } from '@/types/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageSourcePropType, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { DARKEN_BACKGROUND_KEY } from '../types/constants';

const hasCustomBackground = async () => {
  const path = getBackgroundImagePath();
  return await ReactNativeBlobUtil.fs.exists(path);
};

const getBackgroundImagePath = () => {
  const path = ReactNativeBlobUtil.fs.dirs.DocumentDir + '/background.png';
  if (Platform.OS === 'android') {
    return 'file://' + path;
  }
  return path;
};

const setBackgroundImage = async (imagePath: string) => {
  // TODO: https://github.com/RonRadtke/react-native-blob-util/blob/79a9bb6fc49b4d6c01b0846820d935276df76f01/android/src/main/java/com/ReactNativeBlobUtil/ReactNativeBlobUtilFS.java#L602
  // 该库对mv的实现在安卓平台上有问题，改为先复制再删除

  // 先检查目标是否存在，如果存在先删除
  const path = getBackgroundImagePath();
  if (await ReactNativeBlobUtil.fs.exists(path)) {
    await ReactNativeBlobUtil.fs.unlink(path);
  }

  await ReactNativeBlobUtil.fs.cp(imagePath, path);
  await ReactNativeBlobUtil.fs.unlink(imagePath);
};

const getBackgroundImage = (refresh: boolean): ImageSourcePropType => {
  if (refresh) {
    return { uri: getBackgroundImagePath(), cache: 'reload' };
  }
  return { uri: getBackgroundImagePath(), cache: 'default' };
};

const deleteBackgroundImage = async () => {
  const path = getBackgroundImagePath();
  await ReactNativeBlobUtil.fs.unlink(path);
};

const getDarkenBackground = async () => {
  return (await AsyncStorage.getItem(DARKEN_BACKGROUND_KEY)) === 'true';
};

const setDarkenBackground = async (value: boolean) => {
  await AsyncStorage.setItem(DARKEN_BACKGROUND_KEY, value ? 'true' : 'false');
};

export async function getColorScheme(): Promise<'light' | 'dark' | 'system'> {
  const stored = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export async function setColorScheme(value: 'light' | 'dark' | 'system'): Promise<void> {
  await AsyncStorage.setItem(COLOR_SCHEME_KEY, value);
}

export {
  deleteBackgroundImage,
  getBackgroundImage,
  getBackgroundImagePath,
  getDarkenBackground,
  hasCustomBackground,
  setBackgroundImage,
  setDarkenBackground,
};
