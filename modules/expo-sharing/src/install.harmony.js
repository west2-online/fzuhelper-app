'use strict';

const { UnavailabilityError } = require('expo-modules-core');
const NativeSystem = require('../../../application-support/harmony-polyfill/native-system.harmony');

const EXPO_MODULE_NAME = 'ExpoSharing';
let warnedAboutDialogTitle = false;

function incomingShareUnavailable(methodName) {
  throw new UnavailabilityError('expo-sharing', methodName);
}

function installExpoSharing() {
  if (!globalThis.expo?.modules) {
    throw new Error('The Expo global polyfill must be installed before ExpoSharing');
  }
  if (globalThis.expo.modules[EXPO_MODULE_NAME]) {
    return;
  }

  globalThis.expo.modules[EXPO_MODULE_NAME] = {
    async isAvailableAsync() {
      return NativeSystem.isSharingAvailable();
    },

    async shareAsync(uri, options = {}) {
      if (typeof uri !== 'string' || !uri.startsWith('file://')) {
        throw new TypeError('expo-sharing: shareAsync requires a local file:// URI on HarmonyOS');
      }
      if (options.dialogTitle && !warnedAboutDialogTitle) {
        warnedAboutDialogTitle = true;
        console.warn(
          'expo-sharing: HarmonyOS does not expose a custom share-sheet dialog title; dialogTitle is ignored.',
        );
      }
      await NativeSystem.shareFile(uri, '', options.mimeType ?? '');
    },

    getSharedPayloads() {
      return incomingShareUnavailable('getSharedPayloads');
    },

    async getResolvedSharedPayloadsAsync() {
      return incomingShareUnavailable('getResolvedSharedPayloadsAsync');
    },

    clearSharedPayloads() {
      return incomingShareUnavailable('clearSharedPayloads');
    },
  };
}

module.exports = { installExpoSharing };
