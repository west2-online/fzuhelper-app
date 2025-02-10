import { StackActions } from '@react-navigation/native';
import { router, useNavigationContainerRef, type Href } from 'expo-router';
import { useCallback } from 'react';

export function useRedirectWithoutHistory() {
  const rootNavigation = useNavigationContainerRef();

  const redirect = useCallback(
    (href: Href) => {
      rootNavigation.dispatch(StackActions.popToTop());
      router.replace(href);
    },
    [rootNavigation],
  );

  return redirect;
}
