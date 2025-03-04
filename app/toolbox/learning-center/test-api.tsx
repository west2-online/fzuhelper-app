// 用于测试api 的页面

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { LEARNING_CENTER_TOKEN_KEY } from '@/lib/constants';
import ApiService from '@/utils/learning-center/api_service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';
export default function TestApi() {
  const [token, setToken] = useState<null | string>(null);
  const api = new ApiService();

  const handleError = (error: any) => {
    console.error('请求失败:', error);
    toast.error(error.message);
  };

  useEffect(() => {
    const getToken = async () => {
      const tokenStorage = await AsyncStorage.getItem(LEARNING_CENTER_TOKEN_KEY);
      if (tokenStorage) {
        console.log('从本地读取到token:', tokenStorage);
        setToken(tokenStorage);
      }
    };
    getToken();
  }, []);

  const history = async () => {
    const response = await api
      .fetchAppointments({
        currentPage: 1,
        pageSize: 10,
        auditStatus: '',
      })
      .catch(handleError);
    console.log(response);
  };

  const signin = async () => {
    const response = await api.signIn('123456').catch(handleError);
    console.log(response);
  };
  return (
    <View>
      <Text>token:{token}</Text>
      <Button onPress={history}>
        <Text>测试历史记录</Text>
      </Button>
      <Button onPress={signin}>
        <Text>测试签到</Text>
      </Button>
    </View>
  );
}
