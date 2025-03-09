// 这个文件是自定义的插件文件，用于修改默认的配置，比如修改 AndroidManifest.xml 文件，修改 Info.plist 文件等
// 通过这样的方式，我们可以在不修改原生代码的情况下，实现对原生代码的修改
// 如果需要参考具体逻辑，可以参考友盟 SDK
// iOS文档：https://developer.umeng.com/docs/67966/detail/66734
// 安卓文档：https://developer.umeng.com/docs/67966/detail/206987
import { promises as fs } from 'fs'; // 使用 Node.js 的 fs 模块进行文件操作
import { join, resolve } from 'path';

import {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
} from '@expo/config-plugins';

const withKey = (
  config,
  {
    AndroidAppKey,
    channel,
    msgsec,
    mipushAppId,
    mipushAppKey,
    hmspushAppId,
    iOSAppKey,
    bridgingSourcePath,
    bridgingTargetPath,
    NSPushNotificationUsageDescription,
    NSUserTrackingUsageDescription,
  },
) => {
  // Android 配置
  config = withAndroidManifest(config, manifestConfig => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(manifestConfig.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, 'UMENG_APPKEY', AndroidAppKey); // 写入友盟 AppKey
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, 'UMENG_CHANNEL', channel); // 写入友盟渠道
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, 'UMENG_MSGSEC', msgsec); // 写入友盟安全密钥
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, 'MIPUSH_APPID', mipushAppId);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, 'MIPUSH_APPKEY', mipushAppKey);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'com.huawei.hms.client.appid',
      `appid=${hmspushAppId}`,
    );
    return manifestConfig;
  });

  // iOS 配置
  config = withEntitlementsPlist(config, entitlementPlist => {
    // 自动在 iOS 的 entitlements 文件中添加 aps-environment
    entitlementPlist.modResults['aps-environment'] = 'production'; // 或 'development'，根据需求调整
    return entitlementPlist;
  });

  config = withInfoPlist(config, infoPlist => {
    // 如果需要修改 Info.plist，可以在这里添加逻辑
    infoPlist.modResults.UMENG_APPKEY = iOSAppKey; // 写入友盟 AppKey
    infoPlist.modResults.UMENG_CHANNEL = channel; // 写入友盟渠道
    // iOS 不需要写入 UMENG_MESSAGE_SECRET

    // 配置 App Transport Security，允许非 HTTPS 请求（友盟可能需要）
    infoPlist.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: true,
    };

    // 配置后台模式，支持远程通知
    infoPlist.modResults.UIBackgroundModes = infoPlist.modResults.UIBackgroundModes || [];
    if (!infoPlist.modResults.UIBackgroundModes.includes('remote-notification')) {
      infoPlist.modResults.UIBackgroundModes.push('remote-notification');
    }

    // 添加推送通知权限描述（iOS12 及以上开始内容由 Apple 固定，开发者无权干涉）
    infoPlist.modResults.NSPushNotificationUsageDescription = NSPushNotificationUsageDescription;
    // '我们会使用推送通知来推送成绩信息、教务处最新通知，通知发送受福州大学监管，不会泄露您的个人信息';

    // 添加用户追踪权限描述（广告标识符使用）（iOS12 及以上开始内容由 Apple 固定，开发者无权干涉）
    infoPlist.modResults.NSUserTrackingUsageDescription = NSUserTrackingUsageDescription;
    // '我们会使用设备号来分析软件使用情况，以便提供更好的服务以及修复漏洞';
    return infoPlist;
  });

  config = withXcodeProject(config, xcodeConfig => {
    const project = xcodeConfig.modResults;

    // 获取 Target 名称
    const targetName = project.getFirstTarget().firstTarget.name;

    // 设置 Objective-C Bridging Header
    // project.addBuildProperty('SWIFT_OBJC_BRIDGING_HEADER', bridgingTargetPath);

    // 自动启用 Push Notifications Capabilities
    const entitlementsFile = `${targetName}.entitlements`;

    // 确保 entitlements 文件已添加到代码签名设置中
    project.addBuildProperty('CODE_SIGN_ENTITLEMENTS', entitlementsFile);

    // 启用 Push Notifications 系统能力
    if (!project.pbxProjectSection()[`com.apple.Push`]) {
      project.addTargetAttribute('SystemCapabilities', {
        'com.apple.Push': { enabled: 1 },
      });
    }
    return xcodeConfig;
  });

  // 使用 withDangerousMod 介入生成过程，复制模块内的桥接文件到 iOS 项目中
  config = withDangerousMod(config, [
    'ios',
    async iosConfig => {
      const iosProjectPath = join(iosConfig.modRequest.projectRoot, 'ios'); // iOS 项目目录
      const sourcePath = resolve(iosConfig.modRequest.projectRoot, bridgingSourcePath); // Bridging Header 源文件绝对路径
      const targetPath = resolve(iosProjectPath, bridgingTargetPath); // Bridging Header 目标文件绝对路径

      try {
        // 确保目标目录存在
        await fs.mkdir(join(targetPath, '..'), { recursive: true });

        // 检测目标文件是否存在
        try {
          await fs.access(targetPath); // 检查目标文件是否存在
          // 如果存在，读取源文件内容并追加到目标文件末尾
          const sourceContent = await fs.readFile(sourcePath, 'utf8');
          await fs.appendFile(targetPath, `\n${sourceContent}`);
          console.log(`Appended Bridging Header content from ${sourcePath} to ${targetPath}`);
        } catch {
          // 如果目标文件不存在，直接复制源文件
          await fs.copyFile(sourcePath, targetPath);
          console.log(`Copied Bridging Header from ${sourcePath} to ${targetPath}`);
        }
      } catch (error) {
        console.error(`Failed to process Bridging Header: ${error.message}`);
        throw error;
      }

      return iosConfig;
    },
  ]);

  return config;
};

const _default = createRunOncePlugin(withKey, 'umeng-bridge', '0.1.0');
export { _default as default };
