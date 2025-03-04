import LabelEntry from '@/components/label-entry';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import SSOLogin from '@/lib/sso-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, router, Stack, useFocusEffect } from 'expo-router';
import { LEARNING_CENTER_TOKEN_KEY, SSO_LOGIN_COOKIE_KEY } from 'lib/constants';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
const menuItems: {
  name: string;
  route?: '/toolbox/learning-center/seats' | '/toolbox/learning-center/history' | '/toolbox/learning-center/test-api';
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
  {
    name: '测试api',
    route: '/toolbox/learning-center/test-api',
    description: '测试api',
  },
];

const getToken = async () => {
  // 首先尝试从本地读取token
  const tokenStorage = await AsyncStorage.getItem(LEARNING_CENTER_TOKEN_KEY);
  if (tokenStorage) {
    console.log('从本地读取到token:', tokenStorage);
    return tokenStorage;
  }

  // 本地没有就检查SSO是否登录
  const ssoCookie = await AsyncStorage.getItem(SSO_LOGIN_COOKIE_KEY);
  if (!ssoCookie) {
    console.log('未登录SSO，无法获取token');
    return null;
  }

  // sso登录获取token
  const ssoLogin = new SSOLogin();
  const tokenLogin = await ssoLogin.getStudyToken(ssoCookie);
  if (tokenLogin) {
    console.log('通过SSO登录获取到token:', tokenLogin);
    await AsyncStorage.setItem(LEARNING_CENTER_TOKEN_KEY, tokenLogin);
    return tokenLogin;
  }
  return null;
};

export default function LearningCenterPage() {
  const [token, setToken] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 进入页面时获取token
  useFocusEffect(
    useCallback(() => {
      getToken().then(fetchedToken => {
        setToken(fetchedToken);
        setIsLoading(false);
      });
    }, []),
  );
  if (isLoading) {
    return <Loading />;
  }
  return (
    <>
      <Stack.Screen options={{ title: '学习中心预约' }} />
      <PageContainer className="bg-background px-8 pt-4">
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {token ? (
              <View className="space-y-4">
                {menuItems.map((item, index) => (
                  <LabelEntry
                    key={index}
                    leftText={item.name}
                    description={item.description}
                    onPress={
                      item.action ||
                      (item.route
                        ? () =>
                            router.push({
                              pathname: item.route!,
                              params: { token },
                            })
                        : undefined)
                    }
                  />
                ))}
              </View>
            ) : (
              <View className="flex-1 items-center justify-center gap-10">
                <Text className="text-lg">登录统一身份认证平台，享受学习一码通，学习中心预约服务</Text>
                <Button
                  onPress={() => {
                    router.push('/(guest)/unified-auth-login');
                    setIsLoading(true);
                  }}
                  className="w-1/2"
                >
                  <Text>前往登录</Text>
                </Button>

                <Link href="/toolbox/learning-center/webview-login" asChild>
                  <Button className="w-1/2">
                    <Text className="text-white">通过网页登录到学习空间</Text>
                  </Button>
                </Link>
              </View>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
