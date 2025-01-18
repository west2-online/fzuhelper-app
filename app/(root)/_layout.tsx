import { Slot, Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { getApiV1JwchPing } from '@/api/generate';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { isAccountExist } from '@/utils/is-account-exist';

export default function RootLayout() {
  const router = useRouter();
  const { handleError } = useSafeResponseSolve();

  const checkLoginStatus = useCallback(async () => {
    console.log('checkLoginStatus: Trigger Once');

    try {
      if (!(await isAccountExist())) {
        router.replace('/login');

        return;
      }

      const result = await getApiV1JwchPing();
      console.log('请求成功:' + result.data.message);
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        console.log('业务错误', data);
      }

      // 该如何在这里判断是属于异常及过期？
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
