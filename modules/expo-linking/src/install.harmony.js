'use strict';

const { Linking } = require('react-native');

const EXPO_MODULE_NAME = 'ExpoLinking';

function installExpoLinking() {
  if (!globalThis.expo?.NativeModule || !globalThis.expo?.modules) {
    throw new Error('The Expo global polyfill must be installed before ExpoLinking');
  }
  if (globalThis.expo.modules[EXPO_MODULE_NAME]) {
    return;
  }

  const ExpoNativeModule = globalThis.expo.NativeModule;

  class ExpoLinkingHarmonyModule extends ExpoNativeModule {
    constructor() {
      super();
      this.__expo_module_name__ = EXPO_MODULE_NAME;
      this.linkingURL = null;
      this.initialURLWasCleared = false;
      this.nativeSubscription = Linking.addEventListener('url', event => {
        this.initialURLWasCleared = false;
        this.linkingURL = event.url ?? null;
        this.emit('onURLReceived', event);
      });

      Linking.getInitialURL()
        .then(url => {
          if (this.initialURLWasCleared || this.linkingURL != null || url == null) {
            return;
          }
          this.linkingURL = url;
          // React Native exposes the initial URL asynchronously. Emitting here
          // keeps Expo's synchronous useLinkingURL cache and event stream ordered.
          this.emit('onURLReceived', { url });
        })
        .catch(error => {
          console.warn(`expo-linking: failed to read the initial HarmonyOS URL: ${error.message}`);
        });
    }

    getLinkingURL() {
      return this.linkingURL;
    }

    clearInitialURL() {
      this.initialURLWasCleared = true;
      this.linkingURL = null;
    }
  }

  globalThis.expo.modules[EXPO_MODULE_NAME] = new ExpoLinkingHarmonyModule();
}

module.exports = { installExpoLinking };
