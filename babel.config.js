module.exports = function (api) {
  const isHarmony = api.cache.using(() => process.env.EXPO_METRO_TARGET === 'harmony');
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      isHarmony ? '@react-native-ohos/nativewind/babel' : 'nativewind/babel',
    ],
    plugins: ['./babel-plugin-forbidden-imports.js'],
  };
};
