import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/label-entry';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';

import { TOKEN_STORAGE_KEY } from './token';

const NAVIGATION_TITLE = '学习中心预约';

const menuItems: {
  name: string;
  route?: '/toolbox/learning-center/seats' | '/toolbox/learning-center/history';
  description?: string;
  action?: () => void;
}[] = [
  {
    name: '预约座位',
    route: '/toolbox/learning-center/seats',
    description: '预约空闲自习座位',
  },
  {
    name: '预约历史',
    route: '/toolbox/learning-center/history',
    description: '查看过往预约记录',
  },
];

export default function LearningCenterPage() {
  const navigation = useNavigation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        setHasToken(!!token);
        // 如果没有令牌，重定向到令牌获取页面
        if (!token) {
          router.push('/toolbox/learning-center/token');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        toast.error('检查令牌时出错：' + errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [router]);

  const handleClearToken = () => {
    Alert.alert(
      '确认清除令牌',
      '清除后需要重新获取令牌才能使用学习中心功能',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
              toast.success('令牌已清除');
              router.push('/toolbox/learning-center/token');
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : '未知错误';
              toast.error('清除令牌失败: ' + errorMessage);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  // 添加清除令牌的菜单项
  const allMenuItems = [
    ...menuItems,
    {
      name: '清除访问令牌',
      description: '清除当前的访问令牌',
      action: handleClearToken,
    },
  ];

  if (isLoading) {
    return <Loading />;
  }

  if (!hasToken) {
    return null;
  }

  return (
    <PageContainer className="bg-background px-8 pt-4">
      {/* 菜单列表 */}
      <View className="space-y-4">
        {allMenuItems.map((item, index) => (
          <LabelEntry
            key={index}
            leftText={item.name}
            description={item.description}
            onPress={item.action || (item.route ? () => router.push(item.route!) : undefined)}
          />
        ))}
      </View>
    </PageContainer>
  );
}
