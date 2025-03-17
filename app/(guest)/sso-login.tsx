import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import PageContainer from '@/components/page-container';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import {
  SSO_LOGIN_COOKIE_KEY,
  URL_PRIVACY_POLICY,
  URL_USER_AGREEMENT,
  YMT_ACCESS_TOKEN_KEY,
  YMT_USERNAME_KEY,
} from '@/lib/constants';
import SSOLogin from '@/lib/sso-login';
import { pushToWebViewNormal } from '@/lib/webview';
import YMTLogin from '@/lib/ymt-login';

const URL_FORGET_PASSWORD = 'https://idself.fzu.edu.cn/public/client/phone/retrieve';

const UnifiedLoginPage: React.FC = () => {
  const [account, setAccount] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAgree, setIsAgree] = useState(false);
  const { handleError } = useSafeResponseSolve();
  const ymtLogin = useRef<YMTLogin | null>(null);
  const ssoLogin = useRef<SSOLogin | null>(null);

  if (!ymtLogin.current) {
    ymtLogin.current = new YMTLogin();
  }
  if (!ssoLogin.current) {
    ssoLogin.current = new SSOLogin();
  }

  // 处理SSO登录逻辑
  const handleSSOLogin = useCallback(async () => {
    try {
      const cookies = await ssoLogin.current!.login(account, accountPassword);
      await AsyncStorage.setItem(SSO_LOGIN_COOKIE_KEY, cookies);
      console.log('登录SSO成功:', cookies);
      return true;
    } catch (error: any) {
      // 这个 code 和 msg 是 SSO 提供的，不是我们自己定义的
      const data = handleError(error) as { code: string; msg: string };
      if (data) {
        Alert.alert('请求失败', data.code + ': ' + data.msg);
      }
      return false;
    }
  }, [account, accountPassword, handleError]);

  // 处理一码通登录逻辑
  const handleYMTLogin = useCallback(async () => {
    try {
      const { name, accessToken } = await ymtLogin.current!.login(account, accountPassword);
      console.log('登录一码通成功:', name, accessToken);
      await AsyncStorage.multiSet([
        [YMT_ACCESS_TOKEN_KEY, accessToken],
        [YMT_USERNAME_KEY, name],
      ]);
      return true;
    } catch (error: any) {
      const data = handleError(error) as { code: string; msg: string };
      if (data) {
        Alert.alert('请求失败', data.code + ': ' + data.msg);
      }
      return false;
    }
  }, [account, accountPassword, handleError]);

  // 打开服务协议
  const openUserAgreement = useCallback(() => {
    pushToWebViewNormal(URL_USER_AGREEMENT, '服务协议');
  }, []);

  // 打开隐私政策
  const openPrivacyPolicy = useCallback(() => {
    pushToWebViewNormal(URL_PRIVACY_POLICY, '隐私政策');
  }, []);

  // 忘记密码
  const openForgetPassword = useCallback(() => {
    Linking.openURL(URL_FORGET_PASSWORD).catch(err => Alert.alert('错误', '无法打开链接(' + err + ')'));
  }, []);

  // 处理登录逻辑
  const handleLogin = useCallback(async () => {
    if (!isAgree) {
      toast.error('请先阅读并同意服务协议和隐私政策');
      return;
    }
    if (!account) {
      toast.error('请输入用户名');
      return;
    }
    if (!accountPassword) {
      toast.error('请输入密码');
      return;
    }

    setIsLoggingIn(true); // 禁用按钮
    // 由于一码通和SSO使用同一套账号密码 所以这里同时进行一码通和SSO登录
    // 调用统一身份认证登录逻辑

    const isSSOLogin = handleSSOLogin();
    const isYMTLogin = handleYMTLogin();
    if ((await isSSOLogin) && (await isYMTLogin)) {
      router.back();
    }
    setIsLoggingIn(false);
  }, [isAgree, account, accountPassword, handleSSOLogin, handleYMTLogin]);

  return (
    <>
      <Stack.Screen options={{ title: '统一身份认证' }} />
      <PageContainer>
        <SafeAreaView edges={['bottom', 'left', 'right']}>
          <KeyboardAwareScrollView
            className="h-full"
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 justify-between px-6 py-3">
              {/* 左上角标题 */}
              <View className="ml-1 mt-14">
                <Text className="mb-2 text-3xl font-bold">统一身份认证平台登录</Text>
              </View>

              {/* 页面内容 */}
              <View className="items-center justify-center">
                {/* 用户名输入框 */}
                <Input
                  value={account}
                  onChangeText={setAccount}
                  placeholder="请输入学号"
                  className="my-4 w-full px-1 py-3"
                />

                {/* 密码输入框 */}
                <Input
                  value={accountPassword}
                  onChangeText={setAccountPassword}
                  placeholder="请输入密码"
                  secureTextEntry
                  className="mb-12 w-full px-1 py-3"
                />

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

                <View className="w-full flex-row justify-end px-2">
                  {/* 忘记密码按钮 */}
                  <Text className="text-primary" onPress={openForgetPassword}>
                    重置密码
                  </Text>
                </View>

                {/* 公告栏 */}
                <View className="mt-10 w-full px-1">
                  <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
                  <Text className="text-base text-text-secondary">
                    1. 统一身份认证平台为福州大学统一登录系统，可用于登录图书馆、一码通、智汇福大等平台。
                  </Text>
                  <Text className="text-base text-text-secondary">2. 新生可使用身份证号作为登录账号。</Text>
                  <Text className="text-base text-text-secondary">
                    3. 福州大学教务处系统独立于统一身份认证平台，需使用专有密码登录。
                  </Text>
                </View>
              </View>

              {/* 底部协议 */}
              <TouchableOpacity
                activeOpacity={1}
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

export default UnifiedLoginPage;
