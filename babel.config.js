const path = require('node:path');

function harmonyConfig() {
  const workletsRoot = path.dirname(require.resolve('@react-native-ohos/react-native-worklets/package.json'));
  return {
    presets: [
      [require.resolve('babel-preset-expo'), { jsxImportSource: 'nativewind', worklets: false, reanimated: false }],
      require.resolve('@react-native-ohos/nativewind/babel'),
    ],
    plugins: [
      path.resolve(__dirname, 'babel-plugin-forbidden-imports.js'),
      // Match the Worklets implementation embedded in the RNOH HAR (0.7.1).
      path.join(workletsRoot, 'node_modules/react-native-worklets/plugin'),
    ],
  };
}

module.exports = function (api) {
  const isHarmony = api.cache.using(() => process.env.EXPO_HARMONY === '1');
  if (isHarmony) return harmonyConfig();
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: ['./babel-plugin-forbidden-imports.js'],
  };
};
