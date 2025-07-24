// 升级Expo53后，SVG的渲染出现问题，排查发现与BridgelessMode有关
// 未使用，因为仅关闭BridgelessMode会导致iOS运行失败，现在关闭了newArch

import configPlugins from '@expo/config-plugins';
const { withAppDelegate, withMainApplication } = configPlugins;

export default function disableBridgelessMode(config) {
  config = withMainApplication(config, config => {
    const mainApplication = config.modResults;
    if (mainApplication.contents.includes('load()')) {
      mainApplication.contents = mainApplication.contents.replace('load()', 'load(bridgelessEnabled=false)');
      console.log('Bridgeless mode has been disabled in MainApplication.kt');
    } else {
      console.log('WARN: Bridgeless mode is already disabled or not found in MainApplication.kt');
    }
    return config;
  });

  config = withAppDelegate(config, config => {
    const appDelegate = config.modResults;
    if (!appDelegate.contents.includes('bridgelessEnabled')) {
      appDelegate.contents = appDelegate.contents.replace(
        'override func bundleURL',
        `override func bridgelessEnabled() -> Bool {
    return false
  }

  override func bundleURL`,
      );
      console.log('Bridgeless mode has been disabled in AppDelegate.swift');
    } else {
      console.log('WARN: Bridgeless mode is already disabled or not found in AppDelegate.swift');
    }
    return config;
  });

  return config;
}
