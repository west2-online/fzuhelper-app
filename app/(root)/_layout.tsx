import { getApiV1JwchPing } from '@/api/generate';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { Slot, Stack, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function RootLayout() {
  const { handleError } = useSafeResponseSolve();

  const checkLoginStatus = useCallback(async () => {
    console.log('checkLoginStatus: Trigger Once');

    try {
      const result = await getApiV1JwchPing();
      console.log('请求成功:' + result.data.message);
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        console.log('业务错误', data);
      }

      // 该如何在这里判断是属于异常及过期？
    }
  }, [handleError]);

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
