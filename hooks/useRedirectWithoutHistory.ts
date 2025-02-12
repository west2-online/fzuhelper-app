import { StackActions } from '@react-navigation/native';
import { router, useNavigationContainerRef, type Href } from 'expo-router';
import { useCallback } from 'react';

export function useRedirectWithoutHistory() {
  const rootNavigation = useNavigationContainerRef();

  const redirect = useCallback(
    (href: Href) => {
      // 检查是否可以返回到顶部
      if (rootNavigation.canGoBack()) {
        rootNavigation.dispatch(StackActions.popToTop());
      }
      router.replace(href); // 替换到目标路由
    },
    [rootNavigation],
  );

  return redirect;
}
