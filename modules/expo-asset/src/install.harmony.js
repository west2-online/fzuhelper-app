'use strict';

const ReactNativeBlobUtilModule = require('react-native-blob-util');
const NativeSystem = require('../../../application-support/harmony-polyfill/native-system.harmony');

const ReactNativeBlobUtil = ReactNativeBlobUtilModule.default ?? ReactNativeBlobUtilModule;
const EXPO_MODULE_NAME = 'ExpoAsset';

function fileUri(path) {
  return path.startsWith('file://') ? path : `file://${path}`;
}

function installExpoAsset() {
  if (!globalThis.expo?.modules) {
    throw new Error('The Expo global polyfill must be installed before ExpoAsset');
  }
  if (globalThis.expo.modules[EXPO_MODULE_NAME]) {
    return;
  }

  globalThis.expo.modules[EXPO_MODULE_NAME] = {
    async downloadAsync(uri, md5Hash, type) {
      if (typeof uri !== 'string' || uri.length === 0) {
        throw new TypeError('expo-asset: downloadAsync requires a non-empty URI');
      }
      if (uri.startsWith('asset://')) {
        return `rawfile/assets/${uri.slice('asset://'.length)}`;
      }
      if (uri.startsWith('file://') || uri.startsWith('rawfile/')) {
        return uri;
      }
      if (!/^https?:\/\//i.test(uri)) {
        throw new Error(`expo-asset: unsupported HarmonyOS asset URI ${uri}`);
      }

      const cacheKey = md5Hash ?? (await NativeSystem.digestString('SHA-256', uri, 'hex'));
      const extension = typeof type === 'string' && /^[a-z\d]+$/i.test(type) ? `.${type}` : '';
      const destination = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/ExponentAsset-${cacheKey}${extension}`;

      if (await ReactNativeBlobUtil.fs.exists(destination)) {
        if (
          !md5Hash ||
          (await ReactNativeBlobUtil.fs.hash(destination, 'md5')).toLowerCase() === md5Hash.toLowerCase()
        ) {
          return fileUri(destination);
        }
      }

      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        overwrite: true,
        path: destination,
      }).fetch('GET', uri);
      const status = Number(response.info().status);
      if (status < 200 || status >= 300) {
        await ReactNativeBlobUtil.fs.unlink(destination).catch(() => {});
        throw new Error(`expo-asset: download failed with HTTP ${status}`);
      }
      if (md5Hash && (await ReactNativeBlobUtil.fs.hash(destination, 'md5')).toLowerCase() !== md5Hash.toLowerCase()) {
        await ReactNativeBlobUtil.fs.unlink(destination).catch(() => {});
        throw new Error('expo-asset: downloaded asset failed its MD5 integrity check');
      }
      return fileUri(destination);
    },
  };
}

module.exports = { installExpoAsset };
