import {
  LEARNING_CENTER_TOKEN_KEY,
  SSO_LOGIN_COOKIE_KEY,
  YMT_ACCESS_TOKEN_KEY,
  YMT_USERNAME_KEY,
} from '@/types/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SSOlogoutAndCleanData = async () => {
  await AsyncStorage.multiRemove([
    YMT_ACCESS_TOKEN_KEY,
    YMT_USERNAME_KEY,
    LEARNING_CENTER_TOKEN_KEY,
    SSO_LOGIN_COOKIE_KEY,
    // SSO_LOGIN_USER_KEY, // 这个 KEY 是用来存上一次使用用户信息的
  ]);
};
