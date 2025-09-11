import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

import PageContainer from '@/components/page-container';
import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { setAegisConfig } from '@/lib/aegis';
import { URL_PRIVACY_POLICY, URL_USER_AGREEMENT } from '@/lib/constants';
import { LocalUser, USER_TYPE_POSTGRADUATE, USER_TYPE_UNDERGRADUATE } from '@/lib/user';
import UserLogin from '@/lib/user-login';
import { pushToWebViewNormal } from '@/lib/webview';
import BuglyModule from '@/modules/bugly';
import { checkAndroidUpdate, showAndroidUpdateDialog } from '@/utils/android-update';

const URL_RESET_PASSWORD_UNDERGRADUATE = 'https://jwcjwxt2.fzu.edu.cn/Login/ReSetPassWord';
const URL_RESET_PASSWORD_POSTGRADUATE = 'https://yjsglxt.fzu.edu.cn/ResetPassword.aspx';

const LoginPage: React.FC = () => {
  const loginRef = useRef<UserLogin | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
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
      isPostGraduate
        ? '点击「重置密码」，可前往教务处网站进行密码重置。'
        : '本科生登录账号为学号，密码为教务处密码。\n\n点击「重置密码」，可前往教务处网站进行密码重置。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重置密码',
          onPress: () =>
            pushToWebViewNormal(
              isPostGraduate ? URL_RESET_PASSWORD_POSTGRADUATE : URL_RESET_PASSWORD_UNDERGRADUATE,
              '重置密码',
            ),
        },
      ],
    );
  }, [isPostGraduate]);

  // 刷新验证码
  const refreshCaptcha = useCallback(async () => {
    try {
      const res = await loginRef.current!.getCaptcha();
      setCaptchaImage(`data:image/png;base64,${btoa(String.fromCharCode(...res))}`);
      setCaptcha(''); // 清空验证码输入框
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
      scrollViewRef.current?.scrollToEnd();
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
      // 存储登录所需的信息
      await LocalUser.setUser(isPostGraduate ? USER_TYPE_POSTGRADUATE : USER_TYPE_UNDERGRADUATE, username, password); // 设置基本信息
      // 登录、获取 token、检查串号等逻辑
      await LocalUser.login();
      // 登录成功
      setAegisConfig({ uin: username });
      console.log('aegis set uin:', username);
      if (Platform.OS === 'android') {
        BuglyModule.setUserId(username);
      }

      // 跳转到首页
      redirect('/(tabs)');
    } catch (error: any) {
      const data = handleError(error) as { code: string; message: string };
      if (data) {
        Alert.alert('请求失败', data.code + ': ' + data.message);
      }
      await refreshCaptcha();
      // 访问令牌获取失败，清除账户信息
      await LocalUser.clear();
      setAegisConfig({});
      if (Platform.OS === 'android') {
        await BuglyModule.setUserId('');
      }
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

  const handleTextChange = useCallback((text: string) => {
    // 只保留数字
    const filteredText = text.replace(/[^0-9]/g, '');
    setCaptcha(filteredText);
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: '登录', headerShown: false }} />

      <PageContainer>
        <SafeAreaView>
          <KeyboardAwareScrollView
            className="h-full"
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            ref={scrollViewRef}
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
                      onChangeText={handleTextChange}
                      placeholder="请输入验证码"
                      keyboardType="numeric"
                      className="mr-4 flex-1 px-1 py-3"
                    />
                    <TouchableOpacity onPress={refreshCaptcha} activeOpacity={0.7}>
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
                  activeOpacity={0.7}
                  disabled={isLoggingIn}
                  className={`mb-6 w-full items-center justify-center rounded-4xl py-3 ${
                    isLoggingIn ? 'bg-gray-400' : 'bg-primary'
                  }`}
                >
                  <Text className="text-lg font-bold text-white">{isLoggingIn ? '登录中...' : '登 录'}</Text>
                </TouchableOpacity>

                {/* 其他操作 */}
                <View className="w-full flex-row justify-between px-2">
                  <Text className="text-center text-text-secondary" onPress={() => setIsPostGraduate(!isPostGraduate)}>
                    {isPostGraduate ? '本科生登录' : '研究生登录'}
                  </Text>
                  <Text className="text-primary" onPress={openResetPassword}>
                    忘记密码
                  </Text>
                </View>

                {/* 公告栏 */}
                <View className="mt-10 w-full px-1">
                  <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
                  {Platform.OS === 'android' && (
                    <Text className="text-base text-text-secondary">
                      如登录异常，可能是教务系统正在维护，可稍后再试或连接校园网后尝试登录。
                    </Text>
                  )}
                  {Platform.OS === 'ios' && (
                    <>
                      <Text className="text-base text-text-secondary">
                        1. 如登录异常，可能是教务系统正在维护，可稍后再试或连接校园网后尝试登录。
                      </Text>
                      <Text className="text-base text-text-secondary">
                        2. 受 iOS
                        网络策略影响，首次启动可能无法获取验证码，可点击重新获取。如您意外拒绝了网络访问权限，需要手动前往设置打开。
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* 底部协议 */}
              <TouchableOpacity
                activeOpacity={0.7}
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
      </PageContainer>
    </>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
});

export default LoginPage;
