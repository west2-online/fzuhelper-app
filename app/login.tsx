import { getApiV1LoginAccessToken } from '@/api/generate';
import Input from '@/components/Input';
import { ThemedView } from '@/components/ThemedView';
import UserLogin from '@/lib/user-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, Text, TouchableOpacity, View } from 'react-native';

const NAVIGATION_TITLE = '登录';
const URL_USER_AGREEMENT = 'https://fzuhelper.west2.online/onekey/UserAgreement.html';
const URL_PRIVATE_POLICY = 'https://fzuhelper.west2.online/onekey/FZUHelper.html';
const URL_RESET_PASSWORD = 'https://jwcjwxt2.fzu.edu.cn/Login/ReSetPassWord';

const LoginPage: React.FC = () => {
  const loginRef = useRef<UserLogin | null>(null);
  if (!loginRef.current) {
    loginRef.current = new UserLogin();
  }

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  const [captchaImage, setCaptchaImage] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [captcha, setCaptcha] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    try {
      loginRef
        .current!.getCaptcha()
        .then(res => setCaptchaImage(`data:image/png;base64,${btoa(String.fromCharCode(...res))}`));
    } catch (error) {
      console.error(error);
      Alert.alert('错误', '获取验证码失败');
    }
  }, []);

  // 打开用户协议
  const openUserAgreement = useCallback(() => {
    Linking.openURL(URL_USER_AGREEMENT).catch(err => Alert.alert('错误', '无法打开链接(' + err + ')'));
  }, []);

  // 打开隐私政策
  const openPrivatePolicy = useCallback(() => {
    Linking.openURL(URL_PRIVATE_POLICY).catch(err => Alert.alert('错误', '无法打开链接(' + err + ')'));
  }, []);

  // 打开重置密码
  const oepnResetPassword = useCallback(() => {
    Linking.openURL(URL_RESET_PASSWORD).catch(err => Alert.alert('错误', '无法打开链接(' + err + ')'));
  }, []);

  // 刷新验证码
  const refreshCaptcha = useCallback(async () => {
    try {
      const res = await loginRef.current!.getCaptcha();
      setCaptchaImage(`data:image/png;base64,${btoa(String.fromCharCode(...res))}`);
    } catch (error) {
      console.error(error);
      Alert.alert('错误', '获取验证码失败');
    }
  }, []);

  // 处理登录逻辑
  const handleLogin = useCallback(async () => {
    if (!username) {
      Alert.alert('错误', '请输入用户名');
      return;
    }
    if (!password) {
      Alert.alert('错误', '请输入密码');
      return;
    }
    if (!captcha) {
      Alert.alert('错误', '请输入验证码');
      return;
    }

    setIsLoggingIn(true); // 禁用按钮

    try {
      const { id, cookies } = await loginRef.current!.login(username, password, captcha);

      await AsyncStorage.multiSet([
        ['user_id', username],
        ['user_password', password],
        ['id', id],
        ['cookies', cookies],
      ]);

      await getApiV1LoginAccessToken();

      router.push('/'); // 跳转到首页
    } catch (error: any) {
      Alert.alert('错误', '登录失败: ' + (error.data?.message || error.message));
      await refreshCaptcha();
    } finally {
      setIsLoggingIn(false); // 恢复按钮状态
    }
  }, [loginRef, username, password, captcha, refreshCaptcha]);

  return (
    <ThemedView className="flex-1 bg-gray-100 px-6">
      {/* 左上角标题 */}
      <View className="absolute left-6 top-14">
        <Text className="mb-2 text-4xl font-bold">本科生登录</Text>
        <Text className="text-lg text-gray-500">综合性最强的福大校内APP</Text>
      </View>
      {/* 页面内容 */}
      <View className="flex-1 items-center justify-center">
        {/* 用户名输入框 */}
        <Input
          value={username}
          onChangeText={setUsername}
          placeholder="请输入学号"
          className="mb-4 w-full border-b border-gray-300 py-4"
        />

        {/* 密码输入框 */}
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="请输入密码"
          secureTextEntry
          className="mb-4 w-full border-b border-gray-300 py-4"
        />

        {/* 验证码输入框和图片 */}
        <View className="mb-4 w-full flex-row items-center justify-between">
          <Input
            value={captcha}
            onChangeText={setCaptcha}
            placeholder="请输入验证码"
            className="mr-4 flex-1 border-b border-gray-300 py-4"
          />
          {captchaImage && (
            <TouchableOpacity onPress={refreshCaptcha}>
              <Image source={{ uri: captchaImage }} className="h-10 w-28" resizeMode="stretch" />
            </TouchableOpacity>
          )}
        </View>

        {/* 登录按钮 */}
        <TouchableOpacity
          onPress={isLoggingIn ? undefined : handleLogin}
          disabled={isLoggingIn}
          className={`mb-4 w-full items-center justify-center rounded-lg py-3 ${
            isLoggingIn ? 'bg-gray-400' : 'bg-blue-500'
          }`}
        >
          <Text className="text-lg font-bold text-white">{isLoggingIn ? '登录中...' : '登 录'}</Text>
        </TouchableOpacity>

        {/* 其他操作 */}
        <View className="w-full flex-row justify-between px-4">
          {/* TODO: 研究生登录 */}
          <Text className="text-gray-500">研究生登录</Text>
          <Text className="text-blue-500" onPress={oepnResetPassword}>
            重置密码
          </Text>
          {/* <Text className="text-blue-500">游客登录</Text> */}
        </View>
      </View>

      {/* 底部协议 */}
      <Text className="mt-6 pb-6 text-center text-gray-400">
        登录即代表同意{' '}
        <Text className="text-blue-500" onPress={openUserAgreement}>
          用户协议
        </Text>{' '}
        和{' '}
        <Text className="text-blue-500" onPress={openPrivatePolicy}>
          隐私政策
        </Text>
      </Text>
    </ThemedView>
  );
};

export default LoginPage;
