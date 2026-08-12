'use strict';

const { TurboModuleRegistry } = require('react-native');

const EXPO_MODULE_NAME = 'ExpoSplashScreen';
const NATIVE_MODULE_NAME = 'ExpoSplashScreenHarmony';

function installExpoSplashScreen() {
  if (!globalThis.expo?.modules) {
    throw new Error('The Expo global polyfill must be installed before ExpoSplashScreen');
  }
  if (globalThis.expo.modules[EXPO_MODULE_NAME]) {
    return;
  }

  const nativeModule = TurboModuleRegistry.getEnforcing(NATIVE_MODULE_NAME);
  let userControlledAutoHideEnabled = false;
  let warnedAboutAnimationOptions = false;

  globalThis.expo.modules[EXPO_MODULE_NAME] = {
    async preventAutoHideAsync() {
      userControlledAutoHideEnabled = true;
      return true;
    },

    async internalPreventAutoHideAsync() {
      return true;
    },

    async internalMaybeHideAsync() {
      if (!userControlledAutoHideEnabled) {
        nativeModule.hide();
      }
    },

    setOptions(options = {}) {
      if (!warnedAboutAnimationOptions && (options.fade === true || options.duration != null)) {
        warnedAboutAnimationOptions = true;
        console.warn(
          'expo-splash-screen: fade and duration are not supported by the HarmonyOS subwindow implementation.',
        );
      }
    },

    hide() {
      nativeModule.hide();
    },
  };
}

module.exports = { installExpoSplashScreen };
