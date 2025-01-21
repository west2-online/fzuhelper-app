import { getApiV1LoginAccessToken } from '@/api/generate';
import {
  ACCESS_TOKEN_KEY,
  JWCH_COOKIES_KEY,
  JWCH_ID_KEY,
  JWCH_USER_INFO_KEY,
  REFRESH_TOKEN_KEY,
} from '@/lib/constants';
import UserLogin from '@/lib/user-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { toast } from 'sonner-native';

// 清空 AsyncStorage 中的所有用户信息
export async function clearUserStorage() {
  AsyncStorage.multiRemove([JWCH_ID_KEY, JWCH_COOKIES_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, JWCH_USER_INFO_KEY]);
}

// 进行用户登录操作，由于这个函数本身就是由 axios 的响应拦截器调用的，所以我们不能直接使用 oneapi 中的请求函数
// 因此在这里的验证码识别使用了单独的 axios 实例，但请求方式、数据与 oneapi 中是一致的
// 此处的 Promise.reject 只会传递给 api/axios.ts，因此不需要做规范化处理
export async function userLogin(data: { id: string; password: string }) {
  try {
    toast.info('检测到登录状态异常，正在尝试自动重新登录');
    const login = new UserLogin();
    const captchaImage = await login.getCaptcha();
    const { id, cookies } = await login.login(data.id, data.password, captchaImage);

    await AsyncStorage.multiSet([
      [JWCH_ID_KEY, id],
      [JWCH_COOKIES_KEY, cookies],
    ]);

    try {
      await getApiV1LoginAccessToken();
      toast.success('自动重新登录成功');
      return Promise.resolve();
    } catch (e) {
      toast.error('自动重新登录失败');
      return Promise.reject(e);
    }
  } catch (e) {
    // TODO: 此处登录失败后不能直接清空用户信息，因为可能教务处临时崩溃，只能弹出警告
    // 同时，我们可能需要有一个醒目的 Banner 来提示用户当前与教务处离线
    Alert.alert(
      '自动登录失败',
      '自动重新登录失败，将使用缓存数据。可能原因：密码错误或教务处服务器不可用。如需重新登录，请前往“我的”->“退出登录/切换账户”。如需帮助，请加入交流群反馈问题。',
    );
    return Promise.reject(e);
  }
}
