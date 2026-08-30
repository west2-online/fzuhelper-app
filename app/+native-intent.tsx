// DeepLink
// https://docs.expo.dev/router/advanced/native-intent/
import * as Linking from 'expo-linking';

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  console.log('redirectSystemPath', { path, initial });
  try {
    const { hostname, queryParams } = Linking.parse(path);
    console.log('Parsed URL:', { hostname, queryParams });

    if (hostname === 'friend_invite') {
      // fzuhelper://friend_invite?code=ABCDEF
      const code = queryParams?.code;
      const target = encodeURIComponent(`/settings/friend/add?code=${code}`);
      // 在闪屏页做账户初始化相关工作并跳转
      return `/(guest)?target=${target}&cold_launch=${initial}`;
    } else if (hostname === 'qrcode') {
      // fzuhelper://qrcode
      const target = encodeURIComponent('/qrcode');
      return `/(guest)?target=${target}&cold_launch=${initial}`;
    } else if (hostname === 'grade') {
      // fzuhelper://grade
      const target = encodeURIComponent('/toolbox/academic/grades');
      return `/(guest)?target=${target}&cold_launch=${initial}`;
    } else if (hostname === 'exam-room') {
      // fzuhelper://exam-room
      const target = encodeURIComponent('/toolbox/exam-room');
      return `/(guest)?target=${target}&cold_launch=${initial}`;
    } else if (hostname === 'office_notice') {
      // fzuhelper://office_notice
      const noticeUrl = queryParams?.url;
      let target = encodeURIComponent('/toolbox/office-notice');
      if (noticeUrl && typeof noticeUrl === 'string') {
        target = encodeURIComponent(`/toolbox/office-notice?url=${noticeUrl}`);
      }
      return `/(guest)?target=${target}&cold_launch=${initial}`;
    } else if (hostname === null) {
      // 桌面启动
      return path;
    } else if (__DEV__ && hostname === 'expo-development-client') {
      // 调试启动
      return path;
    } else {
      // expo router的默认行为允许导航到app内任意页面，为了安全考虑，非白名单页面直接重定向到not-found
      console.log('非法deeplink:', path);
      return '/+not-found';
    }
  } catch (error) {
    console.error('Failed to handle deep link:', error);
    return '/+not-found';
  }
}
