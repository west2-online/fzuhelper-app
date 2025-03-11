import ReactNativeBlobUtil from 'react-native-blob-util';

const hasCustomBackground = () => {
  return true;
};

const getBackgroundImagePath = () => {
  const path = ReactNativeBlobUtil.fs.dirs.DocumentDir + '/background.png';
  return path;
};

const setBackgroundImage = (imagePath: string) => {
  ReactNativeBlobUtil.fs
    .mv(imagePath, getBackgroundImagePath())
    .then(() => {
      return true;
    })
    .catch(err => {
      throw err;
    });
};

const getBackgroundImage = () => {
  return { uri: getBackgroundImagePath() };
};

const getBottomTabBarHeight = (height: number) => {
  console.log('height', height);
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
  getBackgroundImagePath,
  getBottomTabBarHeight,
  hasCustomBackground,
  setBackgroundImage,
};
