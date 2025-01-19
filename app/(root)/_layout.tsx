import { getApiV1JwchPing } from '@/api/generate';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { isAccountExist } from '@/utils/is-account-exist';
import { Slot, Stack, Tabs, useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect } from 'react';
import { Alert } from 'react-native';

const NAVIGATION_TITLE = '主页';

export default function RootLayout() {
  const router = useRouter();
  const { handleError } = useSafeResponseSolve();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  // 检查登录状态
  const checkLoginStatus = useCallback(async () => {
    try {
      if (!(await isAccountExist())) {
        router.replace('/login');
        return;
      }
      await getApiV1JwchPing(); // 检查当前 App 和服务端的连接状态
      // 此处只会检查 Token 是否有效，不会检查账号是否过期
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        Alert.alert('请求失败', data.code + ': ' + data.message);
      }
      // 如果出现异常，例如网络错误或超时，会在 hooks/useSafeResponseSolve.ts 中处理
      // 这里不必做额外的处理
    }
  }, [handleError, router]);

  // 使用 useFocusEffect 在组件获得焦点时检查登录状态
  useFocusEffect(
    useCallback(() => {
      checkLoginStatus();
    }, [checkLoginStatus]),
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Slot />
    </>
  );
}
