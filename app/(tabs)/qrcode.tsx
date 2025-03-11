import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import { toast } from 'sonner-native';

import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import LoginPrompt from '@/components/sso-login-prompt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';

import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { DATETIME_SECOND_FORMAT, LOCAL_USER_INFO_KEY, YMT_ACCESS_TOKEN_KEY, YMT_USERNAME_KEY } from '@/lib/constants';
import YMTLogin, { type IdentifyRespData, type PayCodeRespData } from '@/lib/ymt-login';

const CurrentTime: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(dayjs().format(DATETIME_SECOND_FORMAT));

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(dayjs().format(DATETIME_SECOND_FORMAT)), 500);

    return () => clearInterval(timeInterval);
  }, []);

  return <Text className="text-sm text-text-secondary">{currentTime}</Text>;
};

interface QRCodeViewProps {
  size: number;
  value?: string;
  color?: string;
}

const QRCodeView: React.FC<QRCodeViewProps> = ({ size, value, color = '#000000' }) =>
  value ? (
    <View className="mx-auto bg-white p-4">
      <QRCode size={size} value={value} color={color} />
    </View>
  ) : (
    <View className="mx-auto my-4" style={{ height: size, width: size }}>
      <Loading />
    </View>
  );

export default function YiMaTongPage() {
  const ymtLoginRef = useRef<YMTLogin | null>(null);

  if (!ymtLoginRef.current) {
    ymtLoginRef.current = new YMTLogin();
  }

  const [accessToken, setAccessToken] = useState<string | null>(null); // 访问令牌
  const [name, setName] = useState<string | null>(null); // 用户名
  const [payCodes, setPayCodes] = useState<PayCodeRespData[]>(); // 支付码
  const [identifyCode, setIdentifyCode] = useState<IdentifyRespData>(); // 身份码
  const [libCodeContent, setLibCodeContent] = useState<string>(); // 图书馆码
  const [currentTab, setCurrentTab] = useState('消费码'); // 当前选项卡
  const [isRefreshing, setIsRefreshing] = useState(false); //
  const { handleError } = useSafeResponseSolve();
  const [qrWidth, setQrWidth] = useState(0);

  const logoutAndCleanData = useCallback(async () => {
    await AsyncStorage.multiRemove([YMT_ACCESS_TOKEN_KEY, YMT_USERNAME_KEY]);
    setAccessToken(null);
  }, []);

  // 刷新支付码和身份码
  const refresh = useCallback(
    async (currentAccessToken: string) => {
      setIsRefreshing(true); // 触发重新渲染

      console.log('刷新中...', currentAccessToken);

      try {
        const [newPayCodes, newIdentifyCode] = await Promise.all([
          ymtLoginRef.current!.getPayCode(currentAccessToken),
          ymtLoginRef.current!.getIdentifyCode(currentAccessToken),
        ]);

        setPayCodes(newPayCodes);
        setIdentifyCode(newIdentifyCode);

        // 如果获取成功，续期 Token，在下次切换到该页面时使用
        const newToken = await ymtLoginRef.current!.getRenewToken(currentAccessToken);
        await AsyncStorage.setItem(YMT_ACCESS_TOKEN_KEY, newToken);
      } catch (error: any) {
        console.error('刷新失败:', error);

        const data = handleError(error);

        if (data) {
          if (data.code === 401) {
            logoutAndCleanData();
            toast.info('一码通登录过期，请重新登录');
            return;
          }

          toast.error('刷新失败：' + data.msg);
        }
      } finally {
        setIsRefreshing(false); // 恢复按钮状态
      }
    },
    [handleError, logoutAndCleanData],
  );

  // 当 accessToken 变更时，自动刷新
  useEffect(() => {
    if (accessToken) {
      refresh(accessToken);
    }
  }, [accessToken, refresh]);

  const getLocalData = useCallback(async () => {
    try {
      const storedAccessToken = await AsyncStorage.getItem(YMT_ACCESS_TOKEN_KEY);
      const storedName = await AsyncStorage.getItem(YMT_USERNAME_KEY);
      const storedUserInfo = await AsyncStorage.getItem(LOCAL_USER_INFO_KEY);
      const parsedUserInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
      const userid = parsedUserInfo ? parsedUserInfo.userid : null;
      setAccessToken(storedAccessToken);
      setName(storedName);
      setLibCodeContent(userid);
    } catch (error) {
      console.error('读取本地数据失败:', error);
      logoutAndCleanData();
    }
  }, [logoutAndCleanData]);

  // 获取焦点时读取本地数据（初始化时，Tab切换时，登录页返回时）
  useFocusEffect(
    useCallback(() => {
      getLocalData();
    }, [getLocalData]),
  );

  useFocusEffect(
    useCallback(() => {
      // 设置刷新和时间间隔
      const refreshInterval = setInterval(() => {
        if (accessToken) {
          console.log('自动刷新 called');
          refresh(accessToken);
        }
      }, 50000);

      return () => {
        clearInterval(refreshInterval);
      };
    }, [refresh, accessToken]),
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
          onPress: logoutAndCleanData,
        },
      ],
      { cancelable: false },
    );
  }, [logoutAndCleanData]);

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
              <Card className="flex-1 rounded-tl-4xl px-1">
                <ScrollView className="pt-3">
                  <CardHeader>
                    <TabsContent value="消费码">
                      <CardTitle>消费码</CardTitle>
                    </TabsContent>
                    <TabsContent value="认证码">
                      <CardTitle>认证码</CardTitle>
                    </TabsContent>
                    <TabsContent value="入馆码">
                      <CardTitle>入馆码</CardTitle>
                    </TabsContent>

                    <CardDescription className="mt-2">
                      <CurrentTime />
                      {name ? ` - ${name}` : ''}
                    </CardDescription>
                  </CardHeader>

                  <CardContent
                    className="flex-col items-center justify-center gap-4"
                    onLayout={event => setQrWidth(event.nativeEvent.layout.width * 0.75)}
                  >
                    <TabsContent value="消费码">
                      <QRCodeView size={qrWidth} value={payCodes?.[0].prePayId} />
                    </TabsContent>
                    <TabsContent value="认证码">
                      <QRCodeView size={qrWidth} value={identifyCode?.content} color={identifyCode?.color} />
                    </TabsContent>
                    <TabsContent value="入馆码">
                      <QRCodeView size={qrWidth} value={libCodeContent} />
                    </TabsContent>

                    <View className="flex-row gap-4">
                      <Button onPress={logout} className="width-full flex-5" variant="outline">
                        <Text className="text-white">退出</Text>
                      </Button>
                      <Button
                        onPress={() => refresh(accessToken)}
                        className="width-full flex-1"
                        disabled={isRefreshing}
                      >
                        <Text className="text-white">{isRefreshing ? '刷新中...' : '刷新'}</Text>
                      </Button>
                    </View>
                  </CardContent>

                  <CardFooter className="flex-row gap-4">
                    <View className="w-full px-1">
                      <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
                      <TabsContent value="消费码">
                        <Text className="text-base text-text-secondary">
                          消费码：适用于福州大学大门、生活区入口及宿舍楼门禁，不可用于桃李园消费。
                        </Text>
                      </TabsContent>
                      <TabsContent value="认证码">
                        <Text className="text-base text-text-secondary">认证码：适用于福州大学铜盘校区入口门禁。</Text>
                      </TabsContent>
                      <TabsContent value="入馆码">
                        <Text className="text-base text-text-secondary">入馆码：适用于福州大学图书馆入口门禁。</Text>
                      </TabsContent>
                    </View>
                  </CardFooter>
                </ScrollView>
              </Card>
            </View>
          </Tabs>
        </View>
      ) : (
        <LoginPrompt message="登录统一身份认证平台，享受一码通服务" />
      )}
    </PageContainer>
  );
}
