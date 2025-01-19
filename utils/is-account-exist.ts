import AsyncStorage from '@react-native-async-storage/async-storage';

import { JWCH_ID_KEY } from '@/lib/constants';

export async function isAccountExist() {
  const id = await AsyncStorage.getItem(JWCH_ID_KEY);
  return !!id;
}
