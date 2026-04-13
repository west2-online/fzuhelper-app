// https://github.com/pchalupa/expo-network-security-config/blob/main/index.js
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const { mkdir, copyFile } = require('fs/promises');
const { join } = require('path');

/**
 * Android network security config
 *
 * @param {import('@expo/config-types').ExpoConfig} config
 * @param {{networkSecurityConfig: string, enable?: boolean}} options
 * @returns {import('@expo/config-types').ExpoConfig} config
 */
module.exports = function withExpoNetworkSecurityConfig(config, { enable, networkSecurityConfig }) {
  // Early return switch
  if (!enable) return config;

  const { getMainApplicationOrThrow } = AndroidConfig.Manifest;
  const { getResourceFolderAsync } = AndroidConfig.Paths;

  // Copy network_security_config.xml to android/app/src/main/res/xml
  withDangerousMod(config, [
    'android',
    async config => {
      const { projectRoot } = config.modRequest;
      const resourcePath = await getResourceFolderAsync(projectRoot);

      await mkdir(join(resourcePath, '/xml'), { recursive: true });
      await copyFile(join(projectRoot, networkSecurityConfig), join(resourcePath, '/xml/network_security_config.xml'));

      return config;
    },
  ]);

  // Add networkSecurityConfig to AndroidManifest.xml
  withAndroidManifest(config, config => {
    const mainApplication = getMainApplicationOrThrow(config.modResults);

    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return config;
  });

  return config;
};
