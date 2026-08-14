'use strict';

const NativeSystem = require('../../../application-support/harmony-polyfill/native-system.harmony');

const EXPO_MODULE_NAME = 'ExpoNavigationBar';

function installExpoNavigationBar() {
  if (!globalThis.expo?.NativeModule || !globalThis.expo?.modules) {
    throw new Error('The Expo global polyfill must be installed before ExpoNavigationBar');
  }
  if (globalThis.expo.modules[EXPO_MODULE_NAME]) {
    return;
  }

  const ExpoNativeModule = globalThis.expo.NativeModule;

  class ExpoNavigationBarHarmonyModule extends ExpoNativeModule {
    constructor() {
      super();
      this.__expo_module_name__ = EXPO_MODULE_NAME;
      this.visibility = 'visible';
    }

    async setStyle(style) {
      await NativeSystem.setNavigationBarButtonStyle(style);
    }

    async setHidden(hidden) {
      const visibility = hidden ? 'hidden' : 'visible';
      await NativeSystem.setNavigationBarVisibility(visibility);
      if (visibility !== this.visibility) {
        this.visibility = visibility;
        this.emit('ExpoNavigationBar.didChange', {
          rawVisibility: hidden ? 1 : 0,
          visibility,
        });
      }
    }

    async getVisibilityAsync() {
      return this.visibility;
    }
  }

  globalThis.expo.modules[EXPO_MODULE_NAME] = new ExpoNavigationBarHarmonyModule();
}

module.exports = { installExpoNavigationBar };
