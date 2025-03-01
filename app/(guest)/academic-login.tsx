import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

import { getApiV1JwchUserInfo, getApiV1LoginAccessToken } from '@/api/generate';
import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import aegis from '@/lib/aegis';
import { JWCH_USER_INFO_KEY, URL_PRIVACY_POLICY, URL_USER_AGREEMENT } from '@/lib/constants';
import { LocalUser, USER_TYPE_POSTGRADUATE, USER_TYPE_UNDERGRADUATE } from '@/lib/user';
import UserLogin from '@/lib/user-login';
import { pushToWebViewNormal } from '@/lib/webview';
import { checkAndroidUpdate, showAndroidUpdateDialog } from '@/utils/android-update';

const NAVIGATION_TITLE = '登录';
const URL_RESET_PASSWORD = 'https://jwcjwxt2.fzu.edu.cn/Login/ReSetPassWord';

const LoginPage: React.FC = () => {
  const loginRef = useRef<UserLogin | null>(null);
  const redirect = useRedirectWithoutHistory();
  if (!loginRef.current) {
    loginRef.current = new UserLogin();
  }

  const [captchaImage, setCaptchaImage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAgree, setIsAgree] = useState(false);
  const [isPostGraduate, setIsPostGraduate] = useState(false);
  const { handleError } = useSafeResponseSolve();

  // 打开服务协议
  const openUserAgreement = useCallback(() => {
    pushToWebViewNormal(URL_USER_AGREEMENT, '服务协议');
  }, []);

  // 打开隐私政策
  const openPrivacyPolicy = useCallback(() => {
    pushToWebViewNormal(URL_PRIVACY_POLICY, '隐私政策');
  }, []);

  // 打开重置密码
  const openResetPassword = useCallback(() => {
    Alert.alert(
      '忘记密码',
      '本科生登录账号为学号，密码为教务处密码。\n\n点击「重置密码」，可前往教务处网站进行密码重置。',
      [
        {
          text: '重置密码',
          onPress: () =>
            Linking.openURL(URL_RESET_PASSWORD).catch(err => Alert.alert('错误', '无法打开链接(' + err + ')')),
        },
        { text: '关闭', style: 'cancel' },
      ],
    );
  }, []);

  // 刷新验证码
  const refreshCaptcha = useCallback(async () => {
    try {
      const res = await loginRef.current!.getCaptcha();
      setCaptchaImage(`data:image/png;base64,${btoa(String.fromCharCode(...res))}`);
    } catch (error) {
      console.error(error);
      toast.error('获取验证码失败');
    }
  }, []);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

  // 处理登录逻辑
  const handleLogin = useCallback(async () => {
    if (!isAgree) {
      toast.error('请先阅读并同意服务协议和隐私政策');
      return;
    }
    // 研究生不需要输入验证码
    if (!isPostGraduate && !captcha) {
      toast.error('请输入验证码');
      return;
    }
    if (!username) {
      toast.error('请输入学号');
      return;
    }
    if (!password) {
      toast.error('请输入密码');
      return;
    }

    setIsLoggingIn(true); // 禁用按钮

    try {
      // 尝试进行登录
      const { id, cookies } = await loginRef.current!.login(username, password, captcha, isPostGraduate);
      // 到此处即视为登录成功
      // 存储所需的信息，这里存储了学号、密码、ID 和 Cookies（后两位负责请求时发送）
      LocalUser.setUser(isPostGraduate ? USER_TYPE_POSTGRADUATE : USER_TYPE_UNDERGRADUATE, username, password); // 设置基本信息
      LocalUser.setCredentials(id, cookies); // 设置登录凭据
      // await AsyncStorage.multiSet([
      //   [JWCH_USER_ID_KEY, username],
      //   [JWCH_USER_PASSWORD_KEY, password],
      //   [JWCH_ID_KEY, id],
      //   [JWCH_COOKIES_KEY, cookies],
      // ]);
      aegis.setConfig({ uin: username });
      console.log('aegis set uin:', username);

      // 通过提供 id和 cookies 获取访问令牌
      await getApiV1LoginAccessToken();

      if (!isPostGraduate) {
        // 获取个人信息
        const result = await getApiV1JwchUserInfo();
        // 存储个人信息到本地
        AsyncStorage.setItem(JWCH_USER_INFO_KEY, JSON.stringify(result.data.data));
      }

      // 跳转到首页
      redirect('/(tabs)');
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        Alert.alert('请求失败', data.code + ': ' + data.message);
      }
      await refreshCaptcha();
    } finally {
      // 恢复按钮状态
      setIsLoggingIn(false);
    }
  }, [isAgree, captcha, username, password, redirect, handleError, refreshCaptcha, isPostGraduate]);

  useEffect(() => {
    // 安卓检查更新
    if (Platform.OS === 'android') {
      checkAndroidUpdate(handleError, {
        onUpdate: data => {
          showAndroidUpdateDialog(data);
        },
      });
    }
  }, [handleError]);

  return (
    <>
      <Stack.Screen options={{ title: NAVIGATION_TITLE, headerShown: false }} />

      <SafeAreaView className="bg-background">
        <KeyboardAwareScrollView
          className="h-full"
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-between px-6 py-3">
            {/* 左上角标题 */}
            <View className="ml-1 mt-14">
              <Text className="mb-2 text-4xl font-bold">{isPostGraduate ? '研究生' : '本科生'}登录</Text>
              <Text className="text-lg text-text-secondary">综合性最强的福大校内APP</Text>
            </View>

            {/* 页面内容 */}
            <View className="items-center justify-center">
              {/* 用户名输入框 */}
              <Input
                value={username}
                onChangeText={setUsername}
                placeholder="请输入学号"
                className="my-4 w-full px-1 py-3"
              />

              {/* 密码输入框 */}
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="请输入密码"
                secureTextEntry
                className="mb-4 w-full px-1 py-3"
              />

              {/* 验证码输入框和图片 */}
              {!isPostGraduate && (
                <View className="mb-12 w-full flex-row items-center justify-between">
                  <Input
                    value={captcha}
                    onChangeText={setCaptcha}
                    placeholder="请输入验证码"
                    className="mr-4 flex-1 px-1 py-3"
                  />
                  <TouchableOpacity onPress={refreshCaptcha}>
                    {captchaImage ? (
                      // 显示验证码图片
                      <Image source={{ uri: captchaImage }} className="h-8 w-40" resizeMode="stretch" />
                    ) : (
                      // 显示灰色占位框
                      <View className="h-8 w-40 items-center justify-center bg-gray-200">
                        <Text className="text-xs text-gray-500">加载中...</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* 登录按钮 */}
              <TouchableOpacity
                onPress={isLoggingIn ? undefined : handleLogin}
                disabled={isLoggingIn}
                className={`mb-6 w-full items-center justify-center rounded-4xl py-3 ${
                  isLoggingIn ? 'bg-gray-400' : 'bg-primary'
                }`}
              >
                <Text className="text-lg font-bold text-white">{isLoggingIn ? '登录中...' : '登 录'}</Text>
              </TouchableOpacity>

              {/* 其他操作 */}
              <View className="w-full flex-row justify-between px-2">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => setIsPostGraduate(!isPostGraduate)}
                  activeOpacity={0.5}
                >
                  <Checkbox checked={isPostGraduate} onCheckedChange={setIsPostGraduate} />
                  <Text className="text-center text-text-secondary">{'  '}我是研究生</Text>
                </TouchableOpacity>
                <Text className="text-primary" onPress={openResetPassword}>
                  忘记密码
                </Text>
              </View>

              {/* 公告栏 */}
              <View className="mt-10 w-full px-1">
                <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
                <Text className="text-base text-text-secondary">
                  1. 教务处在夜间(23:00-06:00)例行维护，可能暂时无法登录
                </Text>
                <Text className="text-base text-text-secondary">
                  2. 非校园网访问可能受阻。如果无法登录请尝试连接校园网
                </Text>
                {Platform.OS === 'ios' && (
                  <Text className="text-base text-text-secondary">
                    3. (仅iOS) 首次使用可能无法显示验证码，可以手动点击刷新
                  </Text>
                )}
                {Platform.OS === 'ios' && (
                  <Text className="text-base text-text-secondary">
                    4. (仅iOS) 如果您意外拒绝了网络访问权限，您需要手动在设置中打开，APP 无法二次请求网络权限
                  </Text>
                )}
              </View>
            </View>

            {/* 底部协议 */}
            <TouchableOpacity
              activeOpacity={0.5}
              className="mb-4 mt-12 w-full flex-row justify-center py-2"
              onPress={() => setIsAgree(!isAgree)}
            >
              <Checkbox checked={isAgree} onCheckedChange={setIsAgree} />
              <Text className="text-center text-text-secondary">
                {'  '}
                阅读并同意{' '}
                <Text
                  className="text-primary"
                  onPress={event => {
                    event.stopPropagation();
                    openUserAgreement();
                  }}
                >
                  服务协议
                </Text>{' '}
                和{' '}
                <Text
                  className="text-primary"
                  onPress={event => {
                    event.stopPropagation();
                    openPrivacyPolicy();
                  }}
                >
                  隐私政策
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
});

export default LoginPage;
