import AsyncStorage from '@react-native-async-storage/async-storage';

export async function isAccountExist() {
  const id = await AsyncStorage.getItem('id');
  return !!id;
}
