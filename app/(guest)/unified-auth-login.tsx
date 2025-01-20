import { ThemedView } from '@/components/ThemedView';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { YMT_ACCESS_TOKEN_KEY, YMT_USERNAME_KEY } from '@/lib/constants';
import YMTLogin from '@/lib/ymt-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NAVIGATION_TITLE = '统一身份认证';
const URL_USER_AGREEMENT = 'https://fzuhelper.west2.online/onekey/UserAgreement.html';
const URL_PRIVACY_POLICY = 'https://fzuhelper.west2.online/onekey/FZUHelper.html';
const URL_FORGET_PASSWORD = 'https://sso.fzu.edu.cn/public/client/forget-password/qr';

const UnifiedLoginPage: React.FC = () => {
  const [account, setAccount] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAgree, setIsAgree] = useState(false);
  const ymtLogin = useRef<YMTLogin | null>(null);
  if (!ymtLogin.current) {
    ymtLogin.current = new YMTLogin();
  }

  // 打开用户协议
  const openUserAgreement = useCallback(() => {
    Linking.openURL(URL_USER_AGREEMENT).catch(err => Alert.alert('错误', '无法打开链接(' + err + ')'));
  }, []);

  // 打开隐私政策
  const openPrivacyPolicy = useCallback(() => {
    Linking.openURL(URL_PRIVACY_POLICY).catch(err => Alert.alert('错误', '无法打开链接(' + err + ')'));
  }, []);

  // 忘记密码
  const openForgetPassword = useCallback(() => {
    Linking.openURL(URL_FORGET_PASSWORD).catch(err => Alert.alert('错误', '无法打开链接(' + err + ')'));
  }, []);

  // 处理登录逻辑
  const handleLogin = useCallback(async () => {
    if (!isAgree) {
      Alert.alert('错误', '请先阅读并同意用户协议和隐私政策');
      return;
    }
    if (!account) {
      Alert.alert('错误', '请输入用户名');
      return;
    }
    if (!accountPassword) {
      Alert.alert('错误', '请输入密码');
      return;
    }

    setIsLoggingIn(true); // 禁用按钮

    try {
      // 调用统一身份认证登录逻辑
      // !! 注意：此处调用的是一码通登录。后续如有其他需求再进行改进 !!
      const { name, accessToken } = await ymtLogin.current!.login(account, accountPassword);

      // 存储所需的信息
      await AsyncStorage.multiSet([
        [YMT_ACCESS_TOKEN_KEY, accessToken],
        [YMT_USERNAME_KEY, name],
      ]);

      console.log('登录成功:', name, accessToken);

      // 跳转到上一页
      router.back();
    } catch (error: any) {
      console.error(error);
      const resp = JSON.parse(error.message);
      Alert.alert('登录失败', resp.msg);
    } finally {
      // 恢复按钮状态
      setIsLoggingIn(false);
    }
  }, [isAgree, account, accountPassword, ymtLogin]);

  return (
    <>
      <Stack.Screen options={{ title: NAVIGATION_TITLE }} />

      <SafeAreaView className="bg-background" edges={['bottom', 'left', 'right']}>
        <ScrollView
          className="h-full"
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView className="flex-1 justify-between px-6 py-3">
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
                <Text className="my-2 text-lg font-bold text-muted-foreground">友情提示</Text>
                <Text className="text-base text-muted-foreground">
                  1. 统一身份认证平台为福州大学统一登录系统，可用于登录图书馆、一码通、智汇福大等平台。
                </Text>
                <Text className="text-base text-muted-foreground">2. 新生可使用身份证号作为登录账号。</Text>
                <Text className="text-base text-muted-foreground">
                  3. 福州大学教务处系统独立于统一身份认证平台，需使用专有密码登录。
                </Text>
              </View>
            </View>

            {/* 底部协议 */}
            <View className="mb-6 mt-12 w-full flex-row justify-center">
              <Checkbox checked={isAgree} onCheckedChange={setIsAgree} />
              <Text className="text-center text-muted-foreground">
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
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
});

export default UnifiedLoginPage;
