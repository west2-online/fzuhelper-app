'use strict';

/* eslint-disable no-bitwise */

const { TurboModuleRegistry } = require('react-native');

const EXPO_MODULE_NAME = 'ExponentConstants';
const SYSTEM_FONTS = Object.freeze(['HarmonyOS Sans']);

function createSessionId() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
    .slice(6, 8)
    .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

function getPrimaryScheme(scheme) {
  if (typeof scheme === 'string') {
    return scheme;
  }
  if (Array.isArray(scheme)) {
    return scheme.find(value => typeof value === 'string');
  }
  return undefined;
}

function installExpoConstants(generatedConfig) {
  if (!globalThis.expo?.modules) {
    throw new Error('The Expo global polyfill must be installed before ExponentConstants');
  }
  if (globalThis.expo.modules[EXPO_MODULE_NAME]) {
    return;
  }

  const expoConfig = generatedConfig?.expoConfig;
  const harmonyConfig = generatedConfig?.harmony;
  if (!expoConfig || !harmonyConfig) {
    throw new Error('The generated HarmonyOS Expo constants are missing');
  }

  const deviceInfo = TurboModuleRegistry.get('RNDeviceInfo');
  const scheme = getPrimaryScheme(expoConfig.scheme);
  const systemVersion = deviceInfo?.getSystemVersion?.();
  const deviceName = deviceInfo?.getModel?.() || undefined;

  globalThis.expo.modules[EXPO_MODULE_NAME] = {
    name: EXPO_MODULE_NAME,
    appOwnership: null,
    debugMode: typeof __DEV__ === 'boolean' ? __DEV__ : false,
    deviceName,
    deviceYearClass: null,
    executionEnvironment: 'bare',
    experienceUrl: '',
    expoRuntimeVersion: null,
    expoVersion: null,
    isDetached: true,
    isHeadless: false,
    linkingUri: scheme ? `${scheme}://` : '',
    manifest: expoConfig,
    sessionId: createSessionId(),
    statusBarHeight: 0,
    systemFonts: SYSTEM_FONTS,
    systemVersion,
    platform: {
      harmony: {
        bundleName: harmonyConfig.bundleName,
        versionCode: harmonyConfig.versionCode,
        versionName: harmonyConfig.versionName,
      },
      ...(scheme ? { scheme } : {}),
    },
    async getWebViewUserAgentAsync() {
      return deviceInfo?.getUserAgent?.() ?? null;
    },
  };
}

module.exports = { installExpoConstants };
