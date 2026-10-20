const harmonyOnlyDependencies = [
  ...Object.keys(require('./package.json').dependencies).filter(name => name.startsWith('@react-native-ohos/')),
  // Transitive dependencies of the Harmony image viewer port.
  '@react-native-camera-roll/camera-roll',
  'rn-fetch-blob',
  // This upstream copy only supplies JS to the Harmony Screens port.
  'react-native-screens-harmony',
];

module.exports = {
  ...(process.env.EXPO_HARMONY === '1'
    ? require('@react-native-oh/react-native-harmony-cli/react-native.config.js')
    : {}),
  dependencies: Object.fromEntries(
    harmonyOnlyDependencies.map(name => [name, { platforms: { ios: null, android: null } }]),
  ),
};
