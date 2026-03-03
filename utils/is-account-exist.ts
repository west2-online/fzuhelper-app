import { ACCESS_TOKEN_KEY } from '@/lib/constants';
import { LocalUser } from '@/lib/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function isAccountExist() {
  // 如果没有加载过用户信息，加载一次后再进行判断
  // 调用这个函数的入口在 @/app/(guest)/index.tsx，即开屏页，我们认为这是最早的入口
  if (!LocalUser.isLoaded) {
    await LocalUser.load();
  }
  const userInfo = LocalUser.getUser();
  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  return !!userInfo.userid || !!accessToken;
}
