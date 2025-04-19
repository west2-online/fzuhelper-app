// 用于测试公寓报修api的页面

import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SSO_LOGIN_COOKIE_KEY } from '@/types/constants';
import SSOLogin from '@/lib/sso-login';
import ApiService from '@/utils/domitory-repair-api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { toast } from 'sonner-native';
export default function DomitoryRepair() {
  const [cookie, setCookie] = useState<string>('');
  const api = useMemo(() => new ApiService(cookie), [cookie]);
  const sso = useMemo(() => new SSOLogin(), []);

  // 登录
  const getCookie = useCallback(async () => {
    await sso
      .getDomitoryRepairCookie((await AsyncStorage.getItem(SSO_LOGIN_COOKIE_KEY)) ?? '')
      .then(setCookie)
      .catch(handleError);
  }, []);

  const history = useCallback(async () => {
    const resp = await api.fetchRepairHistory();
    console.log(resp);
  }, [api]);

  // 错误处理
  const handleError = useCallback((error: any) => {
    toast.error(error.message);
  }, []);

  // 进入页面自动登录
  useEffect(() => {
    getCookie();
  }, []);
  return (
    <PageContainer>
      <ScrollView>
        <Stack.Screen options={{ title: '公寓报修' }} />
        <Text>cookie: {cookie}</Text>
        <Button onPress={getCookie}>
          <Text>登录</Text>
        </Button>
        <Button onPress={history}>
          <Text>获取报修历史</Text>
        </Button>
      </ScrollView>
    </PageContainer>
  );
}
