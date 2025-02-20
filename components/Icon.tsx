import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { View, useColorScheme } from 'react-native';

interface IconProps {
  name: keyof typeof Ionicons.glyphMap; // 限制为 Ionicons 支持的图标名称
  size?: number; // 图标大小，默认为 24
  color?: string; // 自定义颜色（优先级高于自适应颜色）
  className?: string; // 用于支持 Tailwind/NativeWind 的样式
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color, className }) => {
  const colorScheme = useColorScheme();

  // 根据系统主题动态设置默认颜色
  const adaptiveColor = color || (colorScheme === 'dark' ? 'white' : 'black');

  return (
    <View className={className}>
      <Ionicons name={name} size={size} color={adaptiveColor} />
    </View>
  );
};
