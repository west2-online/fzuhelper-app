import { ImageBackground } from 'expo-image';
import { Platform, View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';

import { getBackgroundImage, getDarkenBackground, hasCustomBackground } from '@/lib/appearance';
import { useBottomTabBarHeight as originalUseBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ThemedViewProps = { refreshBackground?: boolean } & ViewProps;

function useSafeBottomTabBarHeight(): number {
  try {
    // 尝试获取 Bottom Tab Bar 的高度
    return originalUseBottomTabBarHeight();
  } catch {
    // 不做任何处理，直接返回 0
    return 0;
  }
}

// 在 Web 上，useHeaderHeight 初始可能为 0，导致布局跳动（内容先顶上去，然后被推下来）
function useSafeHeaderHeight(): number {
  const headerHeight = useHeaderHeight();
  const { top: statusBarHeight } = useSafeAreaInsets();
  if (Platform.OS !== 'web') {
    return headerHeight;
  }
  if (headerHeight === 0) {
    return 64 + statusBarHeight;
  } else {
    return headerHeight;
  }
}

// 这个组件的作用是为页面提供一个背景为 bg-background 颜色或自定义背景、高度至少撑满的容器
// 如果需要自定义样式，可以通过 className 属性传入&覆盖
// 页面编写时，应该将所有内容放在这个容器内。如果页面内容需要滚动，可以在这个容器内嵌套 ScrollView 组件
export default function PageContainer({ className, refreshBackground, ...otherProps }: ThemedViewProps) {
  const bottomTabBarHeight = useSafeBottomTabBarHeight();
  const headerHeight = useSafeHeaderHeight();
  const [customBackground, setCustomBackground] = useState(false);
  const [darkenBackground, setDarkenBackground] = useState(false);

  useEffect(() => {
    const checkBackground = async () => {
      const result = await hasCustomBackground();
      setCustomBackground(result);
      const darken = await getDarkenBackground();
      setDarkenBackground(darken);
    };
    checkBackground();
  }, []);

  return (
    <>
      {customBackground ? (
        <ImageBackground source={getBackgroundImage(refreshBackground ?? false)} className="flex-1">
          {darkenBackground && <View className="absolute h-full w-full bg-[#00000050]" />}
          <View
            className={cn('flex-1', className)}
            style={{
              paddingBottom: bottomTabBarHeight,
              paddingTop: headerHeight,
            }}
            {...otherProps}
          />
        </ImageBackground>
      ) : (
        <View
          className={cn('flex-1 bg-background', className)}
          style={{
            paddingBottom: bottomTabBarHeight,
            paddingTop: headerHeight,
          }}
          {...otherProps}
        />
      )}
    </>
  );
}
