import Ionicons from '@react-native-vector-icons/ionicons';
import { Href, router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import { useTheme } from './app-theme-provider';

interface IconProps {
  name: React.ComponentProps<typeof Ionicons>['name']; // 限制为 Ionicons 支持的图标名称
  size?: number; // 图标大小，默认为 24
  color?: string; // 自定义颜色（优先级高于自适应颜色）
  className?: string; // 用于支持 Tailwind/NativeWind 的样式
  href?: Href; // router 跳转
  onPress?: () => void; // 点击事件，和上面二选一
  accessibilityLabel?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color, className, href, onPress, accessibilityLabel }) => {
  const { isDarkTheme } = useTheme();

  // 根据系统主题动态设置默认颜色
  const adaptiveColor = color || (isDarkTheme ? 'white' : 'black');

  const IconComponent = <Ionicons name={name} size={size} color={adaptiveColor} />;

  if (href) {
    return (
      <View className={className}>
        <BorderlessButton
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          onPress={() => router.push(href)}
          style={styles.button}
        >
          {IconComponent}
        </BorderlessButton>
      </View>
    );
  }

  if (onPress) {
    return (
      <View className={className}>
        <BorderlessButton
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          onPress={onPress}
          style={styles.button}
        >
          {IconComponent}
        </BorderlessButton>
      </View>
    );
  }

  return <View className={className}>{IconComponent}</View>;
};

const styles = StyleSheet.create({
  button: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
