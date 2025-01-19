import { StackActions } from '@react-navigation/native';
import { router, useNavigationContainerRef, type Href } from 'expo-router';

export function useRedirectWithoutHistory() {
  const rootNavigation = useNavigationContainerRef();

  return (href: Href) => {
    rootNavigation.dispatch(StackActions.popToTop());
    router.replace(href);
  };
}
