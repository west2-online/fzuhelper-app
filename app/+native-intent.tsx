// DeepLink
// https://docs.expo.dev/router/advanced/native-intent/
import * as Linking from 'expo-linking';
import * as ExpoSplashScreen from 'expo-splash-screen';

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  console.log('redirectSystemPath', { path, initial });
  try {
    if (initial) {
      // 冷启动
      ExpoSplashScreen.hideAsync();
    }
    const { hostname, queryParams } = Linking.parse(path);
    console.log('Parsed URL:', { hostname, queryParams });

    if (hostname === 'friend_invite') {
      // fzuhelper://friend_invite?code=ABCDEF
      const code = queryParams?.code;
      // router.push({ pathname: '/settings/friend/add', params: { code } });
      return `/settings/friend/add?code=${code}`;
    } else if (hostname === null) {
      // 桌面启动
      return '/';
    } else {
      // expo router的默认行为允许导航到app内任意页面，为了安全考虑，非白名单页面直接重定向到not-found
      console.log('非法deeplink:', path);
      // router.replace('/');
      return '/+not-found';
    }
  } catch (error) {
    console.error('Failed to handle deep link:', error);
    return '/+not-found';
  }
}
