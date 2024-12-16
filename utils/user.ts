import {
  getApiV1InternalUserLogin,
  getApiV1LoginAccessToken,
} from '@/api/generate';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function userLogin(data: { id: string; password: string }) {
  try {
    const res = await getApiV1InternalUserLogin(data);
    const { id, cookies } = res.data.data;
    await AsyncStorage.setItem('id', id);
    await AsyncStorage.setItem('cookies', cookies[0]);
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
