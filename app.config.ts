import { type ExpoConfig } from 'expo/config';
import { AndroidConfig } from 'expo/config-plugins';
import 'ts-node/register'; // Add this to import TypeScript files

const value = (prodValue: string, devValue: string) => (process.env.NODE_ENV === 'production' ? prodValue : devValue);

const config: ExpoConfig = {
  name: 'fzuhelper-app',
  slug: 'fzuhelper-app',
  version: '7.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'fzuhelper',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    bundleIdentifier: 'FzuHelper.FzuHelper',
    buildNumber: '7.0.0',
    supportsTablet: true,
  },
  android: {
    package: value('com.helper.west2ol.fzuhelper', 'com.helper.west2ol.fzuhelper.dev'),
    versionCode: 700001,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/icon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-build-properties',
      {
        android: {
          useLegacyPackaging: true,
          enableProguardInReleaseBuilds: true,
        },
      },
    ],
    './inject-android-config',
    [
      './modules/umeng-bridge/app.plugin.js',
      {
        AndroidAppKey: '', // 发布（正式包名）时需更换
        iOSAppKey: '679132946d8fdd4ad83ab20e', // 发布（正式包名）时需更换
        channel: 'default', // 渠道号
        msgsec: '', // 仅供 Android，iOS 是证书鉴权，具体参考 KeeWeb
        bridgingSourcePath: './modules/umeng-bridge/ios/ExpoUmeng-Bridging-Header.h', // (iOS) 源路径（相对于 app.plugin.js 文件）
        bridgingTargetPath: 'Bridging/ExpoUmeng-Bridging-Header.h', // (iOS) 目标路径（相对于 ios 文件夹）这个文件可以不更改
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
