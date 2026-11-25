import { ImageBackground, View, type ViewProps } from 'react-native';

import { useTheme } from '@/components/app-theme-provider';
import { cn } from '@/lib/utils';
import { BottomTabBarHeightContext } from 'expo-router/build/react-navigation/bottom-tabs/utils/BottomTabBarHeightContext';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useContext, useEffect, useRef } from 'react';

export type ThemedViewProps = { refreshBackground?: boolean } & ViewProps;

// 这个组件的作用是为页面提供一个背景为 bg-background 颜色或自定义背景、高度至少撑满的容器
// 如果需要自定义样式，可以通过 className 属性传入&覆盖
// 页面编写时，应该将所有内容放在这个容器内。如果页面内容需要滚动，可以在这个容器内嵌套 ScrollView 组件
export default function PageContainer({ className, refreshBackground, ...otherProps }: ThemedViewProps) {
  // Expo Router 的 Tabs 使用内置 React Navigation 的高度 context。
  const bottomTabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const headerHeight = useHeaderHeight();
  const lastKnownHeaderHeightRef = useRef(0);
  const { hasCustomBackground, darkenBackground, getBackgroundImage } = useTheme();

  // 修复在新版 React Navigation 中，headerHeight 二次回调为 0 导致 page 高度计算错误的问题
  useEffect(() => {
    if (headerHeight > 0) {
      lastKnownHeaderHeightRef.current = headerHeight;
    }
  }, [headerHeight]);
  const safeHeaderHeight = headerHeight > 0 ? headerHeight : lastKnownHeaderHeightRef.current;

  return (
    <>
      {hasCustomBackground ? (
        <ImageBackground source={getBackgroundImage(refreshBackground ?? false)} className="flex-1">
          {darkenBackground && <View className="absolute h-full w-full bg-[#00000050]" />}
          <View
            className={cn('flex-1', className)}
            style={{ paddingBottom: bottomTabBarHeight, paddingTop: safeHeaderHeight }}
            {...otherProps}
          />
        </ImageBackground>
      ) : (
        <View
          className={cn('flex-1 bg-background', className)}
          style={{ paddingBottom: bottomTabBarHeight, paddingTop: safeHeaderHeight }}
          {...otherProps}
        />
      )}
    </>
  );
}
