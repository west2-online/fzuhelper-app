import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, TextInput } from 'react-native';
import YMTLogin from '../lib/ymt-login';

export default function YiMaTongLoginPage() {
  const [account, setUserId] = useState('');
  const [accountPassword, setPassword] = useState('');
  const ymtLogin = new YMTLogin();

  async function login() {
    try {
      const { name, accessToken } = await ymtLogin.login(account, accountPassword);

      await AsyncStorage.setItem('name', name);
      await AsyncStorage.setItem('accessToken', accessToken);

      console.log('登录成功:', name, accessToken);

      router.push('/yi_ma_tong'); // 跳转到一码通页面
    } catch (error: any) {
      console.error(error);
      Alert.alert('登录失败', error.message);
    }
  }

  return (
    <>
      <TextInput value={account} onChangeText={setUserId} placeholder="用户名" />
      <TextInput
        value={accountPassword}
        onChangeText={setPassword}
        placeholder="密码"
        secureTextEntry
        onSubmitEditing={() => login()}
      />
      <Button title="登录" onPress={() => login()} />
    </>
  );
}
