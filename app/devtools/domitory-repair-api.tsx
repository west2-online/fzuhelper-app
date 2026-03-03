// 用于测试公寓报修api的页面

import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SSO_LOGIN_COOKIE_KEY } from '@/lib/constants';
import SSOLogin from '@/lib/sso-login';
import ApiService, { RepairHistoryData } from '@/utils/domitory-repair-api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { toast } from 'sonner-native';
export default function DomitoryRepair() {
  const [cookie, setCookie] = useState<string>('');
  const [repairHistory, setRepairHistory] = useState<RepairHistoryData[] | null>(null);
  const api = useMemo(() => new ApiService(cookie), [cookie]);
  const sso = useMemo(() => new SSOLogin(), []);

  // 错误处理
  const handleError = useCallback((error: any) => {
    toast.error(error.message);
  }, []);

  // 登录
  const getCookie = useCallback(async () => {
    setCookie('');
    await sso
      .getDomitoryRepairCookie((await AsyncStorage.getItem(SSO_LOGIN_COOKIE_KEY)) ?? '')
      .then(setCookie)
      .catch(handleError);
  }, [handleError, sso]);

  // 获取报修历史
  const history = useCallback(async () => {
    setRepairHistory(null);
    await api.fetchRepairHistory().then(setRepairHistory).catch(handleError);
  }, [handleError, api]);

  // 进入页面自动登录
  useEffect(() => {
    getCookie();
  }, [getCookie]);

  return (
    <PageContainer>
      <ScrollView>
        <Stack.Screen options={{ title: '公寓报修' }} />
        <Text>cookie: {cookie ? cookie : '登录中'}</Text>
        <Button onPress={getCookie}>
          <Text>登录</Text>
        </Button>
        <Text>
          报修历史: {'\n'} {repairHistory ? JSON.stringify(repairHistory, null, 2) : '无'}
        </Text>
        <Button onPress={history}>
          <Text>获取报修历史</Text>
        </Button>
      </ScrollView>
    </PageContainer>
  );
}
