import { ThemedView } from '@/components/ThemedView';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import YMTLogin from '@/lib/ymt-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NAVIGATION_TITLE = '统一身份认证登录';
const URL_USER_AGREEMENT = 'https://fzuhelper.west2.online/onekey/UserAgreement.html';
const URL_PRIVACY_POLICY = 'https://fzuhelper.west2.online/onekey/FZUHelper.html';
const URL_FORGET_PASSWORD = 'https://sso.fzu.edu.cn/public/client/forget-password/qr';

const YiMaTongLoginPage: React.FC = () => {
  const [account, setAccount] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAgree, setIsAgree] = useState(true);
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
      const { name, accessToken } = await ymtLogin.current!.login(account, accountPassword);

      // 存储所需的信息
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['name', name],
      ]);

      console.log('登录成功:', name, accessToken);

      // 跳转到一码通页面
      router.push('/qrcode');
    } catch (error: any) {
      console.error(error);
      Alert.alert('登录失败', error.message);
    } finally {
      // 恢复按钮状态
      setIsLoggingIn(false);
    }
  }, [isAgree, account, accountPassword, ymtLogin]);

  return (
    <>
      <Stack.Screen options={{ title: NAVIGATION_TITLE, headerShown: false }} />

      <SafeAreaView className="bg-background">
        <ScrollView
          className="h-full"
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView className="flex-1 justify-between px-6 py-3">
            {/* 左上角标题 */}
            <View className="ml-1 mt-14">
              <Text className="mb-2 text-4xl font-bold">统一身份认证</Text>
              <Text className="text-lg text-muted-foreground">智汇福大，一码通登录</Text>
            </View>

            {/* 页面内容 */}
            <View className="items-center justify-center">
              {/* 用户名输入框 */}
              <Input
                value={account}
                onChangeText={setAccount}
                placeholder="请输入用户名"
                className="my-4 w-full px-1 py-3"
              />

              {/* 密码输入框 */}
              <Input
                value={accountPassword}
                onChangeText={setAccountPassword}
                placeholder="请输入密码"
                secureTextEntry
                className="mb-4 w-full px-1 py-3"
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

              <View className="w-full flex-row justify-between px-2">
                {/* 提示内容 */}
                <Text className="mb-4 text-sm text-muted-foreground">新生可使用身份证号作为登录账号</Text>

                {/* 忘记密码按钮 */}
                <TouchableOpacity onPress={openForgetPassword}>
                  <Text className="text-sm font-bold text-primary">忘记密码？</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 公告栏 */}
            <View className="mb-6 w-full rounded-lg bg-gray-100 p-4">
              <Text className="text-base text-muted-foreground">
                Q: <Text style={styles.redText}>统一身份认证</Text> 和 <Text style={styles.blueText}>教务处登录</Text>{' '}
                有什么区别？
              </Text>
              <Text className="text-base text-muted-foreground">
                A: <Text style={styles.redText}>统一身份认证</Text> 是福州大学的统一登录系统，可用于登录{' '}
                <Text style={styles.redText}>图书馆</Text>、<Text style={styles.redText}>一码通</Text> 等多个系统。而{' '}
                <Text style={styles.blueText}>教务处登录</Text> 仅限于教务处系统。前者使用的是{' '}
                <Text style={styles.redText}>统一身份认证账号</Text>，后者使用的是{' '}
                <Text style={styles.blueText}>教务处账号</Text>。
                <Text>
                  区别这两者的原因是，福州大学采用了两套登录系统，因此密码可能不一致，如果您忘记了密码，可以在前面链接找到找回密码的入口
                </Text>
              </Text>
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
  redText: {
    fontWeight: 'bold',
    color: 'red', // 红色文字
  },
  blueText: {
    fontWeight: 'bold',
    color: 'blue', // 蓝色文字
  },
});

export default YiMaTongLoginPage;
