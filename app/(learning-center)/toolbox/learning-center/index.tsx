import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ScrollView, View } from 'react-native';

import LabelEntry from '@/components/label-entry';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import LoginPrompt from '@/components/sso-login-prompt';
import { Text } from '@/components/ui/text';

import { LearningCenterContext } from '@/context/learning-center';
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
  const [isLoading, setIsLoading] = useState(true);
  const { token, setToken } = useContext(LearningCenterContext);

  // 进入页面时获取token
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      getToken()
        .then(fetchedToken => {
          setToken(fetchedToken || '');
          setIsLoading(false);
        })
        .catch(error => {
          console.error('获取token失败:', error);
          setIsLoading(false);
          router.replace({
            pathname: '/(guest)/sso-login',
            params: { redirectPath: '/toolbox/learning-center' },
          });
        });
    }, [setToken]),
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: '学习中心' }} />
        <Loading />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '学习中心' }} />

      <PageContainer>
        {token ? (
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
                          params: { token },
                        })
                    : undefined)
                }
              />
            ))}

            {[
              {
                title: '预约流程',
                content: [
                  '打开"预约座位" -> 选择时间段 -> 查找可用座位 -> 确认预约',
                  '同时可在"座位状态"页面中点击"已占用"的座位，查看该座位当天的可用时段',
                ],
              },
              {
                title: '签到流程',
                content: ['打开"我的预约" -> 扫码签到 -> 签到成功'],
              },
              {
                title: '友情提示',
                content: [
                  '1. 一个人只能最多同时预约 3 个座位，最多只能预约 4 小时',
                  '2. 如果某一时间段里存在有效预约，则该时间段查询不到座位',
                  '3. 请按时签到、签退，迟到、早退频繁的同学会暂时被禁止预约',
                  '4. 如果无法在"我的预约"中扫码签到，请检查是否给予本应用相机权限',
                  '5. 学习中心预约服务器硬件条件有限，访问速度可能较慢，请耐心等待',
                  '6. 学习中心地址：福州大学旗山校区研究生科研楼（晋江楼） 4-5 层',
                ],
              },
            ].map((section, index) => (
              <View key={index} className="my-4 space-y-4">
                <Text className="mb-2 text-lg font-bold text-text-secondary">{section.title}</Text>
                {section.content.map((item, idx) => (
                  <Text key={idx} className="text-base text-text-secondary">
                    {item}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
        ) : (
          <LoginPrompt message="登录统一身份认证平台，享受学习中心服务" />
        )}
      </PageContainer>
    </>
  );
}
