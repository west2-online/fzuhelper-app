import { ImageBackground, View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';

import { getBackgroundImage, hasCustomBackground } from '@/lib/appearance';
import { useBottomTabBarHeight as originalUseBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { useEffect, useState } from 'react';

export type ThemedViewProps = ViewProps;

export function useSafeBottomTabBarHeight(): number {
  try {
    // 尝试获取 Bottom Tab Bar 的高度
    return originalUseBottomTabBarHeight();
  } catch {
    // 不做任何处理，直接返回 0
    return 0;
  }
}

// 这个组件的作用是为页面提供一个背景为 bg-background 颜色或自定义背景、高度至少撑满的容器
// 如果需要自定义样式，可以通过 className 属性传入&覆盖
// 页面编写时，应该将所有内容放在这个容器内。如果页面内容需要滚动，可以在这个容器内嵌套 ScrollView 组件
export default function PageContainer({ className, ...otherProps }: ThemedViewProps) {
  const bottomTabBarHeight = useSafeBottomTabBarHeight();
  const headerheight = useHeaderHeight();
  const [customBackground, setCustomBackground] = useState(false);

  useEffect(() => {
    const checkBackground = async () => {
      const result = await hasCustomBackground();
      setCustomBackground(result);
    };
    checkBackground();
  }, []);

  return (
    <>
      {customBackground ? (
        <ImageBackground source={getBackgroundImage()} className="flex-1">
          <View
            className={cn('flex-1', className)}
            style={{ paddingBottom: bottomTabBarHeight, paddingTop: headerheight }}
            {...otherProps}
          />
        </ImageBackground>
      ) : (
        <View
          className={cn('flex-1 bg-background', className)}
          style={{ paddingBottom: bottomTabBarHeight, paddingTop: headerheight }}
          {...otherProps}
        />
      )}
    </>
  );
}
