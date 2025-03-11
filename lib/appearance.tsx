import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

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
  // https://github.com/RonRadtke/react-native-blob-util/blob/79a9bb6fc49b4d6c01b0846820d935276df76f01/android/src/main/java/com/ReactNativeBlobUtil/ReactNativeBlobUtilFS.java#L602
  // 该库对mv的实现在安卓平台上有问题，改为先复制再删除
  await ReactNativeBlobUtil.fs.cp(imagePath, getBackgroundImagePath());
  await ReactNativeBlobUtil.fs.unlink(imagePath);
};

const getBackgroundImage = () => {
  return { uri: getBackgroundImagePath() };
};

const deleteBackgroundImage = async () => {
  const path = getBackgroundImagePath();
  await ReactNativeBlobUtil.fs.unlink(path);
};

export { deleteBackgroundImage, getBackgroundImage, getBackgroundImagePath, hasCustomBackground, setBackgroundImage };
