import { WebParams } from '@/app/(guest)/web';
import { checkCookieJWCH, userLogin } from '@/utils/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { toast } from 'sonner-native';
import { JWCH_COOKIES_KEY, JWCH_ID_KEY, JWCH_USER_ID_KEY, JWCH_USER_PASSWORD_KEY } from './constants';

// 会统一在 URL 后面加上 id 参数，以及携带 jwchCookie，同时会先检查 Cookie 可用性
export async function pushToWebViewJWCH(url: string, title: string) {
  const jwchCookie = await AsyncStorage.getItem(JWCH_COOKIES_KEY);

  const cookieValid = await checkCookieJWCH();
  if (!cookieValid) {
    // 如果 JWCH Cookie 无效，则重新登录
    const jwch_userid = await AsyncStorage.getItem(JWCH_USER_ID_KEY);
    const jwch_passwd = await AsyncStorage.getItem(JWCH_USER_PASSWORD_KEY);
    if (!jwch_userid || !jwch_passwd) {
      toast.error('Cookie 无效，且无法从本地存储中获取账号信息，请手动登录');
    } else {
      toast.info('检测到登录状态过期，正在处理中，稍后会自动跳转');
      await userLogin({ id: jwch_userid, password: jwch_passwd }); // 自动重新登录
    }
  }
  const cookies = await AsyncStorage.getItem(JWCH_COOKIES_KEY);
  const id = await AsyncStorage.getItem(JWCH_ID_KEY);

  // 根据 URL 是否已有查询参数来决定连接符
  const separator = url.includes('?') ? '&' : '?';

  const params: WebParams = {
    url: `${url}${separator}id=${id}`,
    jwchCookie: cookieValid ? (jwchCookie ?? undefined) : (cookies ?? undefined),
    title: title, // 页面标题（可选）
  };

  router.push({
    pathname: '/(guest)/web',
    params, // 传递参数
  });
}
