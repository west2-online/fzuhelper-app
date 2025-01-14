import { getApiV1LoginAccessToken } from '@/api/generate';
import Input from '@/components/Input';
import { ThemedView } from '@/components/ThemedView';
import UserLogin from '@/lib/user-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const NAVIGATION_TITLE = '登录';
const URL_USER_AGREEMENT = 'https://fzuhelper.west2.online/onekey/UserAgreement.html';
const URL_PRIVACY_POLICY = 'https://fzuhelper.west2.online/onekey/FZUHelper.html';
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
  const [isAgree, setIsAgree] = useState<boolean>(false);

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
  const openPrivacyPolicy = useCallback(() => {
    Linking.openURL(URL_PRIVACY_POLICY).catch(err => Alert.alert('错误', '无法打开链接(' + err + ')'));
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
    if (!isAgree) {
      Alert.alert('错误', '请先阅读并同意用户协议和隐私政策');
      return;
    }
    if (!username) {
      Alert.alert('错误', '请输入学号');
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
  }, [isAgree, username, password, captcha, refreshCaptcha]);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <ThemedView className="flex-1 justify-between bg-gray-100 px-6">
        {/* 左上角标题 */}
        <View className="ml-1 mt-14">
          <Text className="mb-2 text-4xl font-bold">本科生登录</Text>
          <Text className="text-lg text-gray-500">综合性最强的福大校内APP</Text>
        </View>
        {/* 页面内容 */}
        <View className="items-center justify-center">
          {/* 用户名输入框 */}
          <Input
            value={username}
            onChangeText={setUsername}
            placeholder="请输入学号"
            className="my-4 w-full border-b border-l-0 border-r-0 border-t-0 border-gray-300 px-1 py-3 text-lg"
          />
          {/* 密码输入框 */}
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="请输入密码"
            secureTextEntry
            className="mb-4 w-full border-b border-l-0 border-r-0 border-t-0 border-gray-300 px-1 py-3 text-lg"
          />
          {/* 验证码输入框和图片 */}
          <View className="mb-12 w-full flex-row items-center justify-between">
            <Input
              value={captcha}
              onChangeText={setCaptcha}
              placeholder="请输入验证码"
              className="mr-4 flex-1 border-b border-l-0 border-r-0 border-t-0 border-gray-300 px-1 py-3 text-lg"
            />
            {captchaImage && (
              <TouchableOpacity onPress={refreshCaptcha}>
                <Image source={{ uri: captchaImage }} className="h-8 w-40" resizeMode="stretch" />
              </TouchableOpacity>
            )}
          </View>
          {/* 登录按钮 */}
          <TouchableOpacity
            onPress={isLoggingIn ? undefined : handleLogin}
            disabled={isLoggingIn}
            className={`rounded-4xl mb-6 w-full items-center justify-center py-3 ${
              isLoggingIn ? 'bg-gray-400' : 'bg-primary'
            }`}
          >
            <Text className="text-lg font-bold text-white">{isLoggingIn ? '登录中...' : '登 录'}</Text>
          </TouchableOpacity>
          {/* 其他操作 */}
          <View className="w-full flex-row justify-between px-2">
            <Text className="text-gray-500">研究生登录</Text>
            <Text className="text-primary" onPress={oepnResetPassword}>
              重置密码
            </Text>
          </View>
        </View>
        {/* 底部协议 */}
        <View className="mb-6 mt-24 w-full flex-row justify-center">
          <Checkbox value={isAgree} onValueChange={setIsAgree} color={isAgree ? '#1089FF' : undefined} />
          <Text className="text-center text-gray-400">
            {'  '}
            阅读并同意{' '}
            <Text className="text-primary" onPress={openUserAgreement}>
              用户协议
            </Text>{' '}
            和{' '}
            <Text className="text-primary" onPress={openPrivacyPolicy}>
              隐私政策
            </Text>
          </Text>
        </View>
      </ThemedView>
    </ScrollView>
  );
};

export default LoginPage;
