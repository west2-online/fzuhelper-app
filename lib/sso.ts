import {
  LEARNING_CENTER_TOKEN_KEY,
  SSO_LOGIN_COOKIE_KEY,
  YMT_ACCESS_TOKEN_KEY,
  YMT_USERNAME_KEY,
} from '@/lib/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SSOlogoutAndCleanData = async () => {
  await AsyncStorage.multiRemove([
    YMT_ACCESS_TOKEN_KEY,
    YMT_USERNAME_KEY,
    LEARNING_CENTER_TOKEN_KEY,
    SSO_LOGIN_COOKIE_KEY,
  ]);
};
