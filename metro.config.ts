// Learn more https://docs.expo.io/guides/customizing-metro
import { getDefaultConfig } from 'expo/metro-config';
import { withNativeWind } from 'nativewind/metro';

const config = getDefaultConfig(__dirname);

export default withNativeWind(config, {
  input: './global.css',
  inlineRem: false,
} as any); // getCSSForPlatform 被错误标记为必需，但实际不需要
