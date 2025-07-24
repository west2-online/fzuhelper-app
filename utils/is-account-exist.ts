import { LocalUser } from '@/lib/user';

export async function isAccountExist() {
  // 如果没有加载过用户信息，加载一次后再进行判断
  // 调用这个函数的入口在 @/app/(guest)/index.tsx，即开屏页，我们认为这是最早的入口
  if (!LocalUser.isLoaded) {
    await LocalUser.load();
  }
  const userInfo = LocalUser.getUser();
  return !!userInfo.userid;
}
