import { type ExpoConfig } from 'expo/config';
import 'ts-node/register'; // Add this to import TypeScript files
import { version } from './package.json';

const IS_DEV = process.env.APP_VARIANT === 'development';

const config: ExpoConfig = {
  name: 'fzuhelper',
  slug: 'fzuhelper-app',
  version,
  githubUrl: 'https://github.com/west2-online/fzuhelper-app',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'fzuhelper',
  userInterfaceStyle: 'automatic',
  ios: {
    appleTeamId: 'MEWHFZ92DY', // Apple Team ID
    appStoreUrl: 'https://apps.apple.com/us/app/%E7%A6%8Fuu/id866768101',
    bundleIdentifier: IS_DEV ? 'FzuHelper.FzuHelper.dev' : 'FzuHelper.FzuHelper',
    buildNumber: version,
    bitcode: true,
    supportsTablet: true,
    associatedDomains: ['applinks:fzuhelperapp.west2.online'], // 支持 Apple Universal Link 功能
    icon: {
      // 此处影响的主要是自动变更的桌面图标，参考：https://support.apple.com/zh-cn/guide/iphone/iph385473442/ios
      dark: './assets/images/icon/dark.png',
      light: './assets/images/icon/light.png',
      tinted: './assets/images/icon/tinted.png',
    },
    infoPlist: {
      // infoPlist 配置项，详见：https://developer.apple.com/documentation/bundleresources/information_property_list
      // 或者：https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html
      // 出口合规设置，详见：https://developer.apple.com/documentation/Security/complying-with-encryption-export-regulations
      ITSAppUsesNonExemptEncryption: false,
      ITSEncryptionExportComplianceCode: '',
      NSCalendarsFullAccessUsageDescription: '我们需要申请日历权限以导出课表、考场安排等内容到日历',
      NSCameraUsageDescription: '我们需要申请相机权限以提供拍照上传头像、学习中心扫码签到等功能',
      NSPhotoLibraryUsageDescription: '我们需要申请相册权限以提供上传头像等功能',
      // 下面这三个定位权限申请缺一不可
      NSLocationWhenInUseUsageDescription: '我们需要在应用内使用您的位置以提供校本化签到定位等功能',
      NSLocationAlwaysAndWhenInUseUsageDescription: '我们需要在应用内使用您的位置以提供校本化签到定位等功能',
      LSApplicationQueriesSchemes: ['itms-apps'],
      CFBundleAllowMixedLocalizations: true,
      CFBundleURLName: 'MEWHFZ92DY.FzuHelper.FzuHelper', // URL Scheme，用于跳转到 App，CFBundleURLSchemes Expo 已经帮忙配置好了
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true, // 允许访问非 HTTPS 的内容
      },
    },
    entitlements: {
      'com.apple.security.application-groups': ['group.FzuHelper.NextCourse'],
    },
  },
  locales: {
    ja: './locales/japanese.json',
    en: './locales/english.json',
    'zh-Hans': './locales/chinese.json',
    'zh-Hant': './locales/chinese-traditional.json',
  },
  android: {
    package: IS_DEV ? 'com.helper.west2ol.fzuhelper.dev' : 'com.helper.west2ol.fzuhelper',
    versionCode: 700001, // 此处不需要修改，将在inject-android-config中自增
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: './assets/images/ic_launcher_foreground.png',
      monochromeImage: './assets/images/ic_launcher_foreground.png',
      backgroundColor: '#FFFFFF',
    },
    permissions: [
      'android.permission.REQUEST_INSTALL_PACKAGES',
      'android.permission.CAMERA',
      'android.permission.READ_CALENDAR',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
  },
  plugins: [
    'expo-router',
    [
      'react-native-permissions',
      {
        iosPermissions: ['Camera', 'Calendars', 'Notifications', 'LocationWhenInUse'],
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          useLegacyPackaging: true,
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          usesCleartextTraffic: true,
          extraMavenRepos: ['https://developer.huawei.com/repo/'],
        },
      },
    ],
    [
      'expo-calendar',
      {
        calendarPermission: '我们需要访问日历以提供导出课表到日历功能', // iOS only
        remindersPermission: '我们需要访问提醒事项以提供导出课表到提醒事项功能', // iOS only
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: '我们需要申请相机权限以提供拍照上传头像、学习中心扫码签到等功能',
        recordAudioAndroid: true,
      },
    ],
    './plugins/inject-android-config',
    './plugins/inject-ios-prebuild',
    [
      './modules/umeng-bridge/app.plugin.js',
      {
        // 以下配置可以暴露在公网，不会导致安全问题
        // Android
        AndroidAppKey: '5dce696b570df3081900033f', // 发布（正式包名）时需更换
        channel: 'default', // Android渠道号
        msgsec: '2931a731b52ca1457b387bcc22cdff32', // 仅供 Android，iOS 是证书鉴权，具体参考 KeeWeb
        mipushAppId: '2882303761517633929',
        mipushAppKey: '5111763312929',
        hmspushAppId: '100423559',
        vivoPushApiKey: 'bfe61ef29b17b1b483e8505f5032a5f9',
        vivoPushAppId: '105570681',
        honorPushAppId: '104498819',
        oppoPushAppKey: '6UNBx7ceC680s48cw4cwocCw8',
        oppoPushAppSecret: '76fb94e392fc1D2e7798b2C2531216d2',
        // iOS
        iOSAppKey: '679132946d8fdd4ad83ab20e', // 发布（正式包名）时需更换
        bridgingSourcePath: './modules/umeng-bridge/ios/ExpoUmeng-Bridging-Header.h', // (iOS) 源路径（相对于 app.plugin.js 文件）
        bridgingTargetPath: 'fzuhelper/fzuhelper-Bridging-Header.h', // (iOS) 目标路径（相对于 ios 文件夹）这个文件可以不更改
        // 请注意：这个文件的格式是符合{targetName}/{targetName}-Bridging-Header.h的，如果你的targetName不是fzuhelper，请更改
        // 如果需要通用的 Header（即对所有 Target 都生效），你需要将其移动到一个独立的文件夹（比如 ios/Bridging）然后在 Xcode Project
        // 的 config 注入过程中加入`project.addBuildProperty('SWIFT_OBJC_BRIDGING_HEADER', bridgingTargetPath);`
        NSPushNotificationUsageDescription:
          '我们会使用推送通知来推送成绩信息、教务处最新通知，通知发送受福州大学监管，不会泄露您的个人信息',
        NSUserTrackingUsageDescription: '我们会使用设备号来分析软件使用情况，以便提供更好的服务以及修复漏洞',
      },
    ],
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          '请允许我们搜集可以用于追踪您或您的设备的应用相关数据，这将会用于投放个性化内容，如教务处通知推送、成绩更新推送等内容.',
      },
    ],
    [
      'react-native-edge-to-edge',
      {
        android: {
          parentTheme: 'Default',
          enforceNavigationBarContrast: false,
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/ic_launcher_foreground.png',
        // 不设置默认的 backgroundColor，会导致 logo 透明背景被改变
        dark: {
          backgroundColor: '#000000',
        },
        imageWidth: 200,
      },
    ],
    [
      'expo-quick-actions',
      {
        iosActions: [
          {
            id: '1',
            title: '一码通',
            subtitle: '一键跳转一码通',
            icon: 'symbol:qrcode',
            params: { href: '/qrcode' },
          },
        ],
        androidIcons: {
          qrcode: {
            foregroundImage: './assets/images/qr_action.png',
            backgroundColor: '#FFFFFF',
          },
        },
      },
    ],
    './plugins/with-android-theme',
    '@bacons/apple-targets', // Apple Targets (e.g. widget)
    [
      'expo-font',
      {
        android: {
          fonts: [
            {
              fontFamily: 'Roboto',
              fontDefinitions: [
                {
                  path: './assets/fonts/Roboto-Regular.ttf',
                  weight: 400,
                },
                {
                  path: './assets/fonts/Roboto-Bold.ttf',
                  weight: 700,
                },
              ],
            },
          ],
        },
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        url: 'https://<sentry_host>/',
        project: '<project_name>',
        organization: '<organization_name>',
        experimental_android: {
          enableAndroidGradlePlugin: true,
          autoUploadProguardMapping: true,
          includeProguardMapping: true,
          dexguardEnabled: true,
          uploadNativeSymbols: true,
          autoUploadNativeSymbols: true,
          includeNativeSources: true,
          includeSourceContext: true,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
