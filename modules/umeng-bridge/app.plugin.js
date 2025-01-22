// 这个文件是自定义的插件文件，用于修改默认的配置，比如修改 AndroidManifest.xml 文件，修改 Info.plist 文件等
// 通过这样的方式，我们可以在不修改原生代码的情况下，实现对原生代码的修改
// 如果需要参考具体逻辑，可以参考友盟 SDK
// iOS文档：https://developer.umeng.com/docs/67966/detail/66734
// 安卓文档：https://developer.umeng.com/docs/67966/detail/206987

const {
  withAndroidManifest,
  AndroidConfig,
  createRunOncePlugin,
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
} = require('@expo/config-plugins');

const withKey = (config, { appkey, channel, msgsec }) => {
  // Android 配置
  config = withAndroidManifest(config, config => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, 'UMENG_APPKEY', appkey);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, 'UMENG_CHANNEL', channel);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, 'UMENG_MSGSEC', msgsec);
    return config;
  });

  // iOS 配置
  config = withEntitlementsPlist(config, config => {
    // 自动在 iOS 的 entitlements 文件中添加 aps-environment
    config.modResults['aps-environment'] = 'development'; // 或 'production'，根据需求调整
    return config;
  });

  config = withInfoPlist(config, config => {
    // 如果需要修改 Info.plist，可以在这里添加逻辑
    // 例如：添加推送通知相关权限描述
    config.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: true,
    };
    config.modResults.UIBackgroundModes = config.modResults.UIBackgroundModes || [];
    if (!config.modResults.UIBackgroundModes.includes('remote-notification')) {
      config.modResults.UIBackgroundModes.push('remote-notification');
    }
    return config;
  });

  config = withXcodeProject(config, config => {
    const project = config.modResults;

    // 自动启用 Push Notifications Capabilities
    const targetName = project.getFirstTarget().firstTarget.name;
    const entitlementsFile = `${targetName}.entitlements`;

    // 确保 entitlements 文件已添加到代码签名设置中
    project.addBuildProperty('CODE_SIGN_ENTITLEMENTS', entitlementsFile);

    // 启用 Push Notifications 系统能力
    if (!project.pbxProjectSection()[`com.apple.Push`]) {
      project.addTargetAttribute('SystemCapabilities', {
        'com.apple.Push': { enabled: 1 },
      });
    }
    return config;
  });

  return config;
};

exports.default = createRunOncePlugin(withKey, 'umeng-bridge', '0.1.0');
