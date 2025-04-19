import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';

import LabelEntry from '@/components/label-entry';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import LoginPrompt from '@/components/sso-login-prompt';
import { Text } from '@/components/ui/text';

import SSOLogin from '@/lib/sso-login';
import { SSO_LOGIN_COOKIE_KEY } from '@/types/constants';

// 该代码暂时作废，目前公寓报修页面还是可以正常使用的，不像学习中心那样卡的要死

const menuItems: {
  name: string;
  route?: '/toolbox/domitory-repair/request' | '/toolbox/domitory-repair/history';
  description?: string;
  action?: () => void;
}[] = [
  {
    name: '我要报修',
    route: '/toolbox/domitory-repair/request',
    description: '提交宿舍维修请求',
  },
  {
    name: '报修记录',
    route: '/toolbox/domitory-repair/history',
    description: '查看过往报修记录',
  },
];

const getCookie = async () => {
  // 因为cookie过期时间过短，不适合保存在本地，所以每次进入页面都需要重新获取
  // 检查SSO登录
  const ssoCookie = await AsyncStorage.getItem(SSO_LOGIN_COOKIE_KEY);
  if (!ssoCookie) {
    console.log('未登录SSO');
    return null;
  }

  // sso登录获取报修的cookie
  const ssoLogin = new SSOLogin();
  console.log('尝试从SSO登录获取cookie：', ssoCookie);
  const cookieLogin = await ssoLogin.getDomitoryRepairCookie(ssoCookie).catch(error => {
    console.error('SSO登录获取cookie失败:', error);
    return null;
  });
  if (cookieLogin) {
    console.log('通过SSO登录获取到cookie:', cookieLogin);
    return cookieLogin;
  } else {
    return null;
  }
};

export default function DomitoryRepairPage() {
  const [cookie, setCookie] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 进入页面时获取token
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      getCookie()
        .then(fetchedCookie => {
          setCookie(fetchedCookie);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('获取token失败:', error);
          setIsLoading(false);
          router.replace({
            pathname: '/(guest)/sso-login',
            params: { redirectPath: '/toolbox/domitory-repair' },
          });
        });
    }, []),
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: '公寓报修' }} />
        <Loading />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '公寓报修' }} />
      <PageContainer>
        {cookie ? (
          <ScrollView className="space-y-4 px-8 pt-4">
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
                          params: { cookie },
                        })
                    : undefined)
                }
              />
            ))}
            <View className="space-y-4">
              <Text className="my-4 text-lg font-bold text-text-secondary">报修流程</Text>
              <Text className="text-base text-text-secondary">
                打开"我要报修" -&gt; 填写报修单 -&gt; 上传图片 -&gt; 提交报修
              </Text>
            </View>

            <View className="space-y-4">
              <Text className="my-4 text-lg font-bold text-text-secondary">友情提示</Text>
              <Text className="text-base text-text-secondary">1.</Text>
              <Text className="text-base text-text-secondary">2.</Text>
              <Text className="text-base text-text-secondary">3.</Text>
              <Text className="text-base text-text-secondary">4.</Text>
              <Text className="text-base text-text-secondary">5.</Text>
              <Text className="text-base text-text-secondary">6.</Text>
            </View>
          </ScrollView>
        ) : (
          <LoginPrompt message="登录统一身份认证平台，享受学习中心服务" />
        )}
      </PageContainer>
    </>
  );
}
