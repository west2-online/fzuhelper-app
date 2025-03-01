import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { TOKEN_STORAGE_KEY } from './token';

const NAVIGATION_TITLE = '预约历史';

export default function HistoryPage() {
  const navigation = useNavigation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (savedToken) {
          setToken(savedToken);
        } else {
          // 如果没有令牌，重定向到令牌获取页面
          router.push('/toolbox/learning-center/token');
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error('检查令牌时出错');
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [router]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <PageContainer className="bg-background px-8 pt-4">
      <View className="space-y-4">
        <Text className="text-lg font-bold">预约历史</Text>
        <Text className="text-base text-text-secondary">此功能正在开发中</Text>
        <Text className="text-sm text-text-secondary">当前令牌: {token ? `${token.substring(0, 10)}...` : '无'}</Text>
      </View>
    </PageContainer>
  );
}
