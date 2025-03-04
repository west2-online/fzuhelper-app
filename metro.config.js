const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

let config = getDefaultConfig(__dirname);

{
  const { transformer, resolver } = config;

  // 配置 transformer 和 resolver
  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter(ext => ext !== 'svg'), // 移除默认的 SVG 解析方法
    sourceExts: [...resolver.sourceExts, 'svg'], // 添加 SVG 支持
  };
}

// 将 `nativewind` 配置应用到 Metro 配置中
module.exports = withNativeWind(config, { input: './global.css' });
