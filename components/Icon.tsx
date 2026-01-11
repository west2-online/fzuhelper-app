import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

interface IconProps {
  name: keyof typeof Ionicons.glyphMap; // 限制为 Ionicons 支持的图标名称
  size?: number; // 图标大小，默认为 24
  color?: string; // 自定义颜色（优先级高于自适应颜色）
  className?: string; // 用于支持 Tailwind/NativeWind 的样式
  href?: Href; // router 跳转
  onPress?: () => void; // 点击事件，和上面二选一
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color, className, href, onPress }) => {
  const { colorScheme } = useColorScheme();

  // 根据系统主题动态设置默认颜色
  const adaptiveColor = color || (colorScheme === 'dark' ? 'white' : 'black');

  const IconComponent = <Ionicons name={name} size={size} color={adaptiveColor} />;

  if (href) {
    return (
      <View className={className}>
        <BorderlessButton onPress={() => router.push(href)}>{IconComponent}</BorderlessButton>
      </View>
    );
  }

  if (onPress) {
    return (
      <View className={className}>
        <BorderlessButton onPress={onPress}>{IconComponent}</BorderlessButton>
      </View>
    );
  }

  return <View className={className}>{IconComponent}</View>;
};
