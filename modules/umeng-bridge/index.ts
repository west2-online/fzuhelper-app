import ExpoUmengModule from './src/ExpoUmengModule';

interface Umeng {
  getMsg(): string;
  deviceToken(): string;
}

export default ExpoUmengModule as Umeng;
