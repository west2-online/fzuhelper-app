import { LocalUser } from '@/lib/user';

export async function isAccountExist() {
  // 如果没有加载过用户信息，加载一次后再进行判断，这个 Load 和 _layout.tsx 中的 Load 都不能删
  // 本地测试 iOS 和安卓的环境表现不一致，两个load都需要保留
  if (!LocalUser.isLoaded) {
    await LocalUser.load();
  }
  const userInfo = LocalUser.getUser();
  console.log('userInfo:', userInfo);
  return !!userInfo.userid;
}
