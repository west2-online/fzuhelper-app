import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { TOKEN_STORAGE_KEY } from './token';

export default function SeatsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');

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
        toast.error(`检查令牌时出错: ${error instanceof Error ? error.message : String(error)}`);
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
    <>
      <Stack.Screen options={{ title: '预约座位' }} />

      <PageContainer className="bg-background px-8 pt-4">
        <View className="space-y-4">
          <Text className="text-base text-text-secondary">此功能正在开发中</Text>
          <Text className="text-sm text-text-secondary">当前令牌: {token ? `${token.substring(0, 10)}...` : '无'}</Text>
        </View>
      </PageContainer>
    </>
  );
}
