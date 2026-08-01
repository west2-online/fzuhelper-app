const path = require('node:path');

const getHarmonyWorkletsPlugin = () =>
  path.join(
    path.dirname(require.resolve('@react-native-ohos/react-native-worklets/package.json')),
    'node_modules',
    'react-native-worklets',
    'plugin',
  );

module.exports = function (api) {
  const platform = api.caller(caller => caller?.platform ?? 'unknown');
  const isHarmony = platform === 'harmony';

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // RNOH's current Reanimated port embeds Worklets 0.7.1. The generic
          // Expo preset otherwise discovers the app's 0.8.3 plugin and stamps
          // every Harmony worklet with an incompatible version.
          ...(isHarmony && { worklets: false, reanimated: false }),
        },
      ],
      'nativewind/babel',
    ],
    plugins: [
      './babel-plugin-forbidden-imports.js',
      // Worklets' Babel plugin must be last.
      ...(isHarmony ? [getHarmonyWorkletsPlugin()] : []),
    ],
  };
};
