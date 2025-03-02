import { LocalUser } from '@/lib/user';

export async function isAccountExist() {
  const userInfo = LocalUser.getUser();
  console.log('userInfo:', userInfo);
  return !!userInfo.userid;
}
