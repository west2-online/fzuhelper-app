import { LocalUser } from '@/lib/user';

export async function isAccountExist() {
  const userInfo = LocalUser.getUser();
  return !!userInfo.userid;
}
