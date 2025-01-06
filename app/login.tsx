import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Image, TextInput, View } from 'react-native';

import { getApiV1LoginAccessToken } from '@/api/generate';
import { ThemedView } from '@/components/ThemedView';
import UserLogin from '@/lib/user-login';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginPage: React.FC = () => {
  const loginRef = useRef<UserLogin | null>(null);
  if (!loginRef.current) {
    loginRef.current = new UserLogin();
  }
  const [captchaImage, setCaptchaImage] = useState<string>('');

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [captcha, setCaptcha] = useState<string>('');

  useEffect(() => {
    try {
      loginRef
        .current!.getCaptcha()
        .then(res =>
          setCaptchaImage(
            `data:image/png;base64,${btoa(String.fromCharCode(...res))}`,
          ),
        );
    } catch (error) {
      console.error(error);
      Alert.alert('错误', '获取验证码失败');
    }
  }, []);

  const handleLogin = useCallback(async () => {
    if (!username) {
      Alert.alert('错误', '请输入用户名');
    }

    if (!password) {
      Alert.alert('错误', '请输入密码');
    }

    if (!captcha) {
      Alert.alert('错误', '请输入验证码');
    }

    try {
      const { id, cookies } = await loginRef.current!.login(
        username,
        password,
        captcha,
      );

      await AsyncStorage.multiSet([
        ['user_id', username],
        ['user_password', password],
        ['id', id],
        ['cookies', cookies],
      ]);

      await getApiV1LoginAccessToken();

      router.push('/'); // 跳转到首页
    } catch (error: any) {
      console.error(JSON.stringify(error));
      Alert.alert(
        '错误',
        '登录失败: ' + (error.data?.message || error.message),
      );
    }
  }, [loginRef, username, password, captcha]);

  return (
    <ThemedView>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="用户名"
        className="m-4 border p-2"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="密码"
        className="m-4 border p-2"
      />

      {captchaImage && (
        <View>
          <Image
            source={{ uri: captchaImage }}
            width={120}
            height={35}
            resizeMode="stretch"
          />
        </View>
      )}

      <TextInput
        value={captcha}
        onChangeText={setCaptcha}
        placeholder="验证码"
        className="m-4 border p-2"
      />

      <Button title="登录" onPress={handleLogin} />
    </ThemedView>
  );
};

export default LoginPage;
