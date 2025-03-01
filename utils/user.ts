import { getApiV1LoginAccessToken } from '@/api/generate';
import { ACCESS_TOKEN_KEY, JWCH_USER_INFO_KEY, REFRESH_TOKEN_KEY } from '@/lib/constants';
import { LocalUser } from '@/lib/user';
import UserLogin from '@/lib/user-login';
import { get } from '@/modules/native-request';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

// 清空 AsyncStorage 中的所有用户信息
export async function clearUserStorage() {
  AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, JWCH_USER_INFO_KEY]);
}

// 进行用户登录操作，由于这个函数本身就是由 axios 的响应拦截器调用的，所以我们不能直接使用 oneapi 中的请求函数
// 因此在这里的验证码识别使用了单独的 axios 实例，但请求方式、数据与 oneapi 中是一致的
// 此处的 Promise.reject 只会传递给 api/axios.ts，因此不需要做规范化处理
export async function userLogin(data: { id: string; password: string }) {
  try {
    const login = new UserLogin();
    const captchaImage = await login.getCaptcha();
    const { id, cookies } = await login.login(data.id, data.password, captchaImage);

    await LocalUser.setCredentials(id, cookies);

    try {
      await getApiV1LoginAccessToken();
      return Promise.resolve();
    } catch (e) {
      // accessToken 获取失败
      return Promise.reject(e);
    }
  } catch (e) {
    // 教务处登录失败
    return Promise.reject(e);
  }
}

// 检查 JWCH 的 Cookie 是否有效，如果无效，重新自动登录
export async function checkCookieJWCH() {
  const COOKIE_CHECK_URL = 'https://jwcjwxt2.fzu.edu.cn:81/jcxx/xsxx/StudentInformation.aspx?id='; // 尝试访问学生个人信息页面
  const credentials = LocalUser.getCredentials();
  if (!credentials.identifier || !credentials.cookies) {
    return false;
  }
  const resp = await get(COOKIE_CHECK_URL + credentials.identifier, {
    Referer: 'https://jwch.fzu.edu.cn',
    ORIGIN: 'https://jwch.fzu.edu.cn',
    'X-Requested-With': 'XMLHttpRequest',
    Cookie: credentials.cookies,
  });

  const str = Buffer.from(resp.data).toString('utf-8').replace(/\s+/g, '');
  const schoolid = /id="ContentPlaceHolder1_LB_xh">(\d+)/.exec(str)?.[1];

  const userid = LocalUser.getUser().userid;
  if (!schoolid || !userid) {
    return false;
  }

  return (schoolid && userid && schoolid === userid) || false;
}
