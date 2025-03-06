import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import { toast } from 'sonner-native';

import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';

import Loading from '@/components/loading';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { LOCAL_USER_INFO_KEY, YMT_ACCESS_TOKEN_KEY, YMT_USERNAME_KEY } from '@/lib/constants';
import YMTLogin, { IdentifyRespData, PayCodeRespData } from '@/lib/ymt-login';

export default function YiMaTongPage() {
  const ymtLogin = useMemo(() => new YMTLogin(), []);
  const [accessToken, setAccessToken] = useState<string | null>(null); // 访问令牌
  const [currentTime, setCurrentTime] = useState(new Date()); // 当前时间
  const [name, setName] = useState<string | null>(null); // 用户名
  const [payCodes, setPayCodes] = useState<PayCodeRespData[]>(); // 支付码
  const [identifyCode, setIdentifyCode] = useState<IdentifyRespData>(); // 身份码
  const [libCodeContent, setLibCodeContent] = useState<string | null>(null); // 图书馆码
  const [currentTab, setCurrentTab] = useState('消费码'); // 当前选项卡
  const [isRefreshing, setIsRefreshing] = useState(false); // 用于触发重新渲染
  const handleErrorRef = useRef(useSafeResponseSolve().handleError);

  const handleError = handleErrorRef.current;

  const logoutCleanData = useCallback(async () => {
    await AsyncStorage.multiRemove([YMT_ACCESS_TOKEN_KEY, YMT_USERNAME_KEY]);
    setAccessToken(null);
  }, []);

  // 刷新支付码和身份码
  const refresh = useCallback(async () => {
    setIsRefreshing(true); // 触发重新渲染
    if (accessToken) {
      try {
        const [newPayCodes, newIdentifyCode] = await Promise.all([
          ymtLogin.getPayCode(accessToken),
          ymtLogin.getIdentifyCode(accessToken),
        ]);

        setPayCodes(newPayCodes);
        setIdentifyCode(newIdentifyCode);

        // 如果获取成功，续期 Token，在下次切换到该页面时使用
        const newToken = await ymtLogin.getRenewToken(accessToken);
        await AsyncStorage.setItem(YMT_ACCESS_TOKEN_KEY, newToken);
      } catch (error: any) {
        console.error('刷新失败:', error);
        const data = handleError(error);
        if (data) {
          if (data.code === 401) {
            logoutCleanData();
            toast.info('一码通登录过期，请重新登录');
            return;
          }
          toast.error('刷新失败：' + data.msg);
        }
      } finally {
        setIsRefreshing(false); // 恢复按钮状态
      }
    }
  }, [accessToken, ymtLogin, handleError, logoutCleanData]);

  // 当 accessToken 变更时，自动刷新
  useEffect(() => {
    if (accessToken) {
      refresh();
    }
  }, [accessToken, refresh]);

  // 获取焦点时读取本地数据（初始化时，Tab切换时，登录页返回时）
  useFocusEffect(
    useCallback(() => {
      // 读取本地数据
      async function getLocalData() {
        try {
          const storedAccessToken = await AsyncStorage.getItem(YMT_ACCESS_TOKEN_KEY);
          const storedName = await AsyncStorage.getItem(YMT_USERNAME_KEY);

          const storedUserInfo = await AsyncStorage.getItem(LOCAL_USER_INFO_KEY);
          const { userid } = storedUserInfo ? JSON.parse(storedUserInfo) : null;
          setAccessToken(storedAccessToken);
          setName(storedName);
          setLibCodeContent(userid);
        } catch (error) {
          console.error('读取本地数据失败:', error);
          logoutCleanData();
        }
      }
      getLocalData();
      // 设置刷新和时间间隔
      const refreshInterval = setInterval(() => {
        if (accessToken) {
          refresh();
        }
      }, 50000);
      const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

      return () => {
        clearInterval(refreshInterval);
        clearInterval(timeInterval);
      };
      // 解决重复刷新的问题
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const logout = useCallback(() => {
    Alert.alert(
      '确认退出',
      '您确定要退出吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定',
          onPress: logoutCleanData,
        },
      ],
      { cancelable: false },
    );
  }, [logoutCleanData]);

  const [qrWidth, setQrWidth] = useState(0);

  const renderQRCodeCard = useCallback(
    (title: string, codeContent: string | null, codeColor: string) => (
      <Card className="flex-1 rounded-tl-4xl px-1">
        <ScrollView className="pt-3">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-2">
              {currentTime.toLocaleDateString() + ' '}
              {currentTime.toLocaleTimeString()}
              {name ? ' - ' + name : ''}
            </CardDescription>
          </CardHeader>
          <CardContent
            className="flex-col items-center justify-center gap-4"
            onLayout={event => {
              setQrWidth(event.nativeEvent.layout.width * 0.75);
            }}
          >
            {/* 这里使用 bg-white 来强制在各种颜色模式下的二维码背景都是白色 */}
            {codeContent ? (
              <View className="mx-auto bg-white p-4">
                <QRCode size={qrWidth} value={codeContent} color={codeColor} />
              </View>
            ) : (
              <Loading className="p-5" />
            )}
            <View className="flex-row gap-4">
              <Button onPress={logout} className="width-full flex-5">
                <Text className="text-white">退出</Text>
              </Button>
              <Button onPress={refresh} className="width-full flex-1" disabled={isRefreshing}>
                <Text className="text-white">{isRefreshing ? '刷新中...' : '刷新'}</Text>
              </Button>
            </View>
          </CardContent>

          <CardFooter className="flex-row gap-4">
            <View className="w-full px-1">
              <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
              {currentTab === '消费码' ? (
                <Text className="text-base text-text-secondary">
                  消费码：适用于福州大学大门、生活区入口及宿舍楼门禁，不可用于桃李园消费。
                </Text>
              ) : currentTab === '认证码' ? (
                <Text className="text-base text-text-secondary">认证码：适用于福州大学铜盘校区入口门禁。</Text>
              ) : (
                <Text className="text-base text-text-secondary">入馆码：适用于福州大学图书馆入口门禁。</Text>
              )}
            </View>
          </CardFooter>
        </ScrollView>
      </Card>
    ),
    [currentTime, name, qrWidth, logout, refresh, isRefreshing, currentTab],
  );

  return (
    <PageContainer>
      {accessToken ? (
        <View className="flex-1">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-6 flex-1 items-center">
            <TabsList className="ml-auto w-auto flex-row">
              <TabsTrigger value="消费码" className="w-auto">
                <Text className="text-center">消费码</Text>
              </TabsTrigger>
              <TabsTrigger value="认证码" className="w-auto">
                <Text className="text-center">认证码</Text>
              </TabsTrigger>
              <TabsTrigger value="入馆码" className="w-auto">
                <Text className="text-center">入馆码</Text>
              </TabsTrigger>
            </TabsList>

            <View className="flex-1">
              <TabsContent value="消费码">
                {payCodes && renderQRCodeCard('消费码', payCodes[0].prePayId, '#000000')}
              </TabsContent>

              <TabsContent value="认证码">
                {identifyCode && renderQRCodeCard('认证码', identifyCode.content, identifyCode.color)}
              </TabsContent>
              <TabsContent value="入馆码">
                {libCodeContent && renderQRCodeCard('入馆码', libCodeContent, '#000000')}
              </TabsContent>
            </View>
          </Tabs>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center gap-10">
          <Text className="text-lg">登录统一身份认证平台，享受一码通服务</Text>
          <Link href="/unified-auth-login" asChild>
            <Button className="w-1/2">
              <Text className="text-white">前往登录</Text>
            </Button>
          </Link>
        </View>
      )}
    </PageContainer>
  );
}
