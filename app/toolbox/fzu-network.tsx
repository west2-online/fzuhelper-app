import CookieManager from '@preeternal/react-native-cookie-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppStateStatus } from 'react-native';
import { ActivityIndicator, AppState, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/label-entry';
import LabelSwitch from '@/components/label-switch';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SSO_LOGIN_USER_KEY } from '@/lib/constants';
import {
  cancelMac,
  checkOnlineStatus,
  loginNetwork,
  loginSelfService,
  logoutNetwork,
  type NetworkStatus,
  registerMac,
  SELFSERVICE_BASE,
  SELFSERVICE_HOME_URL,
  STATUS_COLOR,
  STATUS_LABEL,
} from '@/lib/fzu-network';
import { pushToWebViewNormal } from '@/lib/webview';

export default function FzuNetworkPage() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isMacToggling, setIsMacToggling] = useState(false);
  const [isSelfServiceLoading, setIsSelfServiceLoading] = useState(false);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFocused = useRef(false);
  const isMacTogglingRef = useRef(false);
  const statusRef = useRef<NetworkStatus | null>(null);
  const isCheckingRef = useRef(false);

  // 查询一次在线状态，MAC切换期间跳过，避免干扰结果
  const handleCheck = useCallback(async () => {
    if (isMacTogglingRef.current || isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsChecking(true);
    try {
      const result = await checkOnlineStatus();
      setStatus(result);
      statusRef.current = result;
    } catch {
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, []);

  // 5秒刷新一次状态
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      handleCheck();
      intervalRef.current = setInterval(handleCheck, 5000);
      return () => {
        isFocused.current = false;
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [handleCheck]),
  );

  // 后台停止刷新，回到前台继续刷新
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (!isFocused.current) return;
      if (state === 'active') {
        if (intervalRef.current === null) {
          handleCheck();
          intervalRef.current = setInterval(handleCheck, 5000);
        }
      } else {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    });
    return () => sub.remove();
  }, [handleCheck]);

  // 读取本地存储的SSO账号密码并发起登录，未登录则跳转到登录页
  const handleLogin = useCallback(async () => {
    const raw = await AsyncStorage.getItem(SSO_LOGIN_USER_KEY);
    if (!raw) {
      router.push('/(guest)/sso-login');
      return;
    }
    const { account, password } = JSON.parse(raw) as { account: string; password: string };
    setIsLoggingIn(true);
    try {
      const result = await loginNetwork(account, password);
      if (result.success) {
        const newStatus = await checkOnlineStatus();
        setStatus(newStatus);
      } else if (result.message) {
        toast.error(result.message);
      }
    } catch {
      // silently ignore
    } finally {
      setIsLoggingIn(false);
    }
  }, [router]);

  // 主动下线，成功后立即刷新状态
  const handleLogout = useCallback(async () => {
    if (!status?.userIndex) {
      return;
    }
    setIsLoggingIn(true);
    try {
      const success = await logoutNetwork(status.userIndex);
      if (success) {
        const newStatus = await checkOnlineStatus();
        setStatus(newStatus);
      } else {
        toast.error('下线失败，请稍后重试');
      }
    } catch {
      toast.error('下线请求失败，请检查网络连接');
    } finally {
      setIsLoggingIn(false);
    }
  }, [status]);

  // 登录自助服务系统并注入Cookie，再跳转WebView
  const handleSelfService = useCallback(async () => {
    if (isSelfServiceLoading) return;
    const raw = await AsyncStorage.getItem(SSO_LOGIN_USER_KEY);
    if (!raw) {
      router.push('/(guest)/sso-login');
      return;
    }
    const { account, password } = JSON.parse(raw) as { account: string; password: string };
    setIsSelfServiceLoading(true);
    try {
      const cookies = await loginSelfService(account, password);
      await CookieManager.clearAll();
      await Promise.all(cookies.split(';').map(c => CookieManager.setFromResponse(SELFSERVICE_BASE, c)));
      pushToWebViewNormal(SELFSERVICE_HOME_URL, '校园网自助服务');
    } catch {
      toast.error('自助服务系统登录失败，请稍后重试');
    } finally {
      setIsSelfServiceLoading(false);
    }
  }, [router, isSelfServiceLoading]);

  const isOnline = status?.result === 'success';
  const isWaiting = status?.result === 'wait';
  const macRegistered = status?.mabRegistered ?? false;

  // 切换无感认证：从ref读取最新状态，切换期间暂停轮询
  const handleMacToggle = useCallback(async () => {
    const currentStatus = statusRef.current;
    const userIndex = currentStatus?.userIndex;
    if (!userIndex) return;
    isMacTogglingRef.current = true;
    setIsMacToggling(true);
    try {
      if (currentStatus?.mabRegistered) {
        await cancelMac(userIndex);
      } else {
        await registerMac(userIndex);
      }
      const newStatus = await checkOnlineStatus();
      setStatus(newStatus);
      statusRef.current = newStatus;
    } catch {
      // silently ignore
    } finally {
      isMacTogglingRef.current = false;
      setIsMacToggling(false);
    }
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: '校园网' }} />
      <PageContainer>
        <ScrollView className="space-y-4 px-8" contentContainerClassName="pt-4">
          <SafeAreaView edges={['bottom']}>
            <View className="flex-row items-center justify-between">
              <View>
                {status === null ? (
                  <Text className="text-base text-text-secondary">正在获取校园网状态...</Text>
                ) : (
                  <>
                    <Text
                      className={`text-2xl font-bold ${STATUS_COLOR[status.result ?? 'error'] ?? 'text-text-secondary'}`}
                    >
                      {STATUS_LABEL[status.result ?? 'error'] ?? '未知'}
                    </Text>
                    {status.result !== 'success' && status.mabRegistered && (
                      <Text className="mt-1 text-sm text-text-secondary">无感认证已开启</Text>
                    )}
                  </>
                )}
              </View>
              {isChecking && <ActivityIndicator size="small" />}
            </View>

            <View className="mt-4 flex-row space-x-3">
              <Button className="flex-1" onPress={handleLogin} disabled={isLoggingIn || isOnline || isWaiting}>
                <Text className="font-semibold">登录</Text>
              </Button>
              <Button variant="outline" className="flex-1" onPress={handleLogout} disabled={isLoggingIn || !isOnline}>
                <Text className="font-semibold">下线</Text>
              </Button>
            </View>

            <Text className="mb-2 mt-6 text-sm text-text-secondary">连接设置</Text>
            <LabelSwitch
              label="无感认证"
              description="记住此设备MAC，下次无需手动登录"
              value={macRegistered}
              onValueChange={handleMacToggle}
              disabled={!isOnline || isMacToggling}
            />
            <LabelEntry leftText="校园网自助服务" onPress={handleSelfService} disabled={isSelfServiceLoading} />

            {/* Tips */}
            <View className="space-y-4">
              <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
              <Text className="my-2 text-base text-text-secondary">此功能仅在连接校园网时可用</Text>
              <Text className="my-2 text-base text-text-secondary">无感认证等情况下可能无法正确获取校园网状态</Text>
            </View>
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
