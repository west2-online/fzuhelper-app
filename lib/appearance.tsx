import * as FileSystem from 'expo-file-system';
import { memo } from 'react';
import { ImageBackground } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

const hasCustomBackground = () => {
  return true;
};

const getBackgroundImagePath = () => {
  const path = ReactNativeBlobUtil.fs.dirs.DocumentDir + '/background.png';
  console.log('background path', path);
  return path;
};

const getBackgroundImage = () => {
  return { uri: getBackgroundImagePath() };
};

const getBackgroundImageComponent = () => {
  if (!hasCustomBackground()) {
    return undefined;
  }
  return <ImageBackground source={getBackgroundImage()} className="h-full w-full" />;
};

const deleteBackgroundImage = async () => {
  const path = getBackgroundImagePath();
  try {
    await ReactNativeBlobUtil.fs.unlink(path);
    console.log('delete success');
  } catch (err) {
    console.log('delete error', err);
  }
};

export {
  deleteBackgroundImage,
  getBackgroundImage,
  getBackgroundImageComponent,
  getBackgroundImagePath,
  hasCustomBackground,
};
