import { type ExpoConfig } from 'expo/config';
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
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
