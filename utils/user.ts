import { getApiV1LoginAccessToken, postApiV1UserValidateCode } from '@/api/generate';
import {
  ACCESS_TOKEN_KEY,
  JWCH_COOKIES_KEY,
  JWCH_ID_KEY,
  JWCH_USER_INFO_KEY,
  REFRESH_TOKEN_KEY,
} from '@/lib/constants';
import UserLogin from '@/lib/user-login';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 清空 AsyncStorage 中的所有用户信息
export async function clearUserStorage() {
  AsyncStorage.multiRemove([JWCH_ID_KEY, JWCH_COOKIES_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, JWCH_USER_INFO_KEY]);
}

// 进行用户登录操作
export async function userLogin(data: { id: string; password: string }) {
  try {
    const login = new UserLogin();
    const captchaImage = await login.getCaptcha();
    const {
      data: { data: captcha },
    } = await postApiV1UserValidateCode({
      image: `data:image/png;base64,${btoa(String.fromCharCode(...captchaImage))}`,
    });
    const { id, cookies } = await login.login(data.id, data.password, captcha);

    await AsyncStorage.multiSet([
      [JWCH_ID_KEY, id],
      [JWCH_COOKIES_KEY, cookies],
    ]);

    try {
      await getApiV1LoginAccessToken();
      return Promise.resolve();
    } catch (e) {
      // TODO 提示token获取失败
      return Promise.reject();
    }
  } catch (e) {
    // TODO 提示登录失败
    return Promise.reject();
  }
}
