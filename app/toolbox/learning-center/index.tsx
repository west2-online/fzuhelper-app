import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import LabelEntry from '@/components/label-entry';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import LoginPrompt from '@/components/sso-login-prompt';
import { Text } from '@/components/ui/text';

import SSOLogin from '@/lib/sso-login';
import { LEARNING_CENTER_TOKEN_KEY, SSO_LOGIN_COOKIE_KEY } from 'lib/constants';

const menuItems: {
  name: string;
  route?: '/toolbox/learning-center/time-select' | '/toolbox/learning-center/history';
  description?: string;
  action?: () => void;
}[] = [
  {
    name: '预约座位',
    route: '/toolbox/learning-center/time-select',
    description: '预约空闲自习座位',
  },
  {
    name: '我的预约',
    route: '/toolbox/learning-center/history',
    description: '查看过往预约记录',
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
    console.log('未登录SSO');
    return null;
  }

  // sso登录获取token
  const ssoLogin = new SSOLogin();
  const tokenLogin = await ssoLogin.getStudyToken(ssoCookie).catch(error => {
    console.error('SSO登录获取token失败:', error);
    return null;
  });
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
      getToken()
        .then(fetchedToken => {
          setToken(fetchedToken);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('获取token失败:', error);
          setIsLoading(false);
          router.push('/(guest)/sso-login');
        });
    }, []),
  );
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: '学习中心预约' }} />
        <Loading />
      </>
    );
  }
  return (
    <>
      <Stack.Screen options={{ title: '学习中心预约' }} />
      <PageContainer>
        {token ? (
          <View className="space-y-4 bg-background px-8 pt-4">
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
            <View className="space-y-4">
              <Text className="my-4 text-lg font-bold text-text-secondary">预约流程</Text>
              <Text className="text-base text-text-secondary">
                打开"预约座位" -&gt; 选择时间段 -&gt; 查找可用座位 -&gt; 确认预约
              </Text>
            </View>
            <View className="space-y-4">
              <Text className="my-4 text-lg font-bold text-text-secondary">签到流程</Text>
              <Text className="text-base text-text-secondary">
                进入学习中心 -&gt; 打开"我的预约" -&gt; 扫码签到 -&gt; 签到成功
              </Text>
            </View>
            <View className="space-y-4">
              <Text className="my-4 text-lg font-bold text-text-secondary">友情提示</Text>
              <Text className="text-base text-text-secondary">
                1. 一个人只能最多同时预约 3 个座位，最多只能预约 4 小时
              </Text>
              <Text className="text-base text-text-secondary">
                2. 如果时间段里有已经预约过的座位，会查询不到任何结果
              </Text>
              <Text className="text-base text-text-secondary">
                3. 请按时签到、签退，迟到、早退频繁的同学会暂时被禁止预约
              </Text>
              <Text className="text-base text-text-secondary">
                4. 如果无法在"我的预约"中扫码签到，请检查是否给予本应用相机权限
              </Text>
              <Text className="text-base text-text-secondary">
                5. 学习中心预约服务器硬件条件有限，访问速度可能较慢，请耐心等待
              </Text>
              <Text className="text-base text-text-secondary">
                6. 学习中心地址：福州大学旗山校区研究生科研楼（晋江楼） 4-5 层
              </Text>
            </View>
          </View>
        ) : (
          <LoginPrompt />
        )}
      </PageContainer>
    </>
  );
}
