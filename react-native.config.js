'use strict';

const harmonyCliPackage = '@react-native-oh/react-native-harmony-cli';
const harmonyOnlyDependencies = [
  '@react-native-oh-tpl/react-native-linear-gradient',
  '@react-native-ohos/async-storage',
  '@react-native-ohos/blur',
  '@react-native-ohos/clipboard',
  '@react-native-ohos/cookies',
  '@react-native-ohos/geolocation',
  '@react-native-ohos/react-native-blob-util',
  '@react-native-ohos/react-native-camera-kit',
  '@react-native-ohos/react-native-device-info',
  '@react-native-ohos/react-native-gesture-handler',
  '@react-native-ohos/react-native-image-crop-picker',
  '@react-native-ohos/react-native-image-zoom-viewer',
  '@react-native-ohos/react-native-keyboard-controller',
  '@react-native-ohos/react-native-permissions',
  '@react-native-ohos/react-native-reanimated',
  '@react-native-ohos/react-native-safe-area-context',
  '@react-native-ohos/react-native-screens',
  '@react-native-ohos/react-native-splash-screen',
  '@react-native-ohos/react-native-svg',
  '@react-native-ohos/react-native-webview',
  '@react-native-ohos/react-native-worklets',
];

let harmonyCliPath;
try {
  harmonyCliPath = require.resolve(harmonyCliPackage);
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') {
    throw error;
  }
}

module.exports = {
  commands: harmonyCliPath ? require(harmonyCliPath).config.commands : [],
  dependencies: Object.fromEntries(
    harmonyOnlyDependencies.map(name => [name, { platforms: { android: null, ios: null } }]),
  ),
};
