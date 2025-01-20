import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { YMT_ACCESS_TOKEN_KEY, YMT_USERNAME_KEY } from '@/lib/constants';
import YMTLogin, { IdentifyRespData, PayCodeRespData } from '@/lib/ymt-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { toast } from 'sonner-native';
export default function YiMaTongPage() {
  const ymtLogin = useMemo(() => new YMTLogin(), []);
  const [accessToken, setAccessToken] = useState<string | null>(null); // 访问令牌
  const [currentTime, setCurrentTime] = useState(new Date()); // 当前时间
  const [Name, setName] = useState<string | null>(null); // 用户名
  const [PayCodes, setPayCodes] = useState<PayCodeRespData[]>(); // 支付码
  const [IdentifyCode, setIdentifyCode] = useState<IdentifyRespData>(); // 身份码
  const [currentTab, setCurrentTab] = useState('消费码'); // 当前选项卡

  // 刷新支付码和身份码
  const refresh = useCallback(async () => {
    if (accessToken) {
      try {
        const payCodes = await ymtLogin.getPayCode(accessToken);
        setPayCodes(payCodes);

        const identifyCode = await ymtLogin.getIdentifyCode(accessToken);
        setIdentifyCode(identifyCode);

        // 如果获取成功，续期 Token，在下次切换到该页面时使用
        const newToken = await ymtLogin.getRenewToken(accessToken);
        await AsyncStorage.setItem(YMT_ACCESS_TOKEN_KEY, newToken);
      } catch (error: any) {
        console.error('刷新失败:', error.message);
        if (error.code === 401) {
          logoutCleanData();
          toast.info('一码通登录过期，请重新登录');
          return;
        }
        toast.error('刷新失败：' + error.message);
      }
    }
  }, [accessToken, ymtLogin]);

  // 获取焦点时读取本地数据（初始化时，Tab切换时，登录页返回时）
  useFocusEffect(
    useCallback(() => {
      // 读取本地数据
      async function getLocalData() {
        try {
          const storedAccessToken = await AsyncStorage.getItem(YMT_ACCESS_TOKEN_KEY);
          const storedName = await AsyncStorage.getItem(YMT_USERNAME_KEY);

          setAccessToken(storedAccessToken);
          setName(storedName);

          console.log('读取本地数据成功:', storedAccessToken);
          refresh();
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
    }, [accessToken, refresh]),
  );

  async function logout() {
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
  }

  async function logoutCleanData() {
    await AsyncStorage.removeItem(YMT_ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(YMT_USERNAME_KEY);
    setAccessToken(null);
  }

  function renderQRCodeCard(title: string, codeContent: string | null, codeColor: string) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {currentTime.toLocaleDateString() + ' '}
            {currentTime.toLocaleTimeString()}
            {Name ? ' - ' + Name : ''}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-row justify-center gap-4">
          {codeContent ? <QRCode value={codeContent} size={340} color={codeColor} /> : <Text>Loading...</Text>}
        </CardContent>

        <CardFooter className="flex-row gap-4">
          <Button onPress={logout} className="width-full flex-5">
            <Text>退出</Text>
          </Button>
          <Button onPress={refresh} className="width-full flex-1">
            <Text>刷新</Text>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  return (
    <View className="flex-1">
      {/* Tabs 组件 */}
      {accessToken && (
        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="flex-1" // 让 Tabs 占满父容器
        >
          {/* Tabs 内容区域 */}
          <View className="flex-1">
            <TabsContent
              value="消费码"
              className="flex-1 items-center justify-center" // 让内容居中并占满空间
            >
              {PayCodes && renderQRCodeCard('消费码', PayCodes[0].prePayId, '#000000')}
            </TabsContent>

            <TabsContent value="认证码" className="flex-1 items-center justify-center">
              {IdentifyCode && renderQRCodeCard('认证码', IdentifyCode.content, IdentifyCode.color)}
            </TabsContent>
          </View>

          {/* Tabs 切换按钮 */}
          <TabsList className="w-full flex-row">
            <TabsTrigger value="消费码" className="flex-1">
              <Text className="text-center">消费码</Text>
            </TabsTrigger>
            <TabsTrigger value="认证码" className="flex-1">
              <Text className="text-center">认证码</Text>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* 登录提示 */}
      {!accessToken && (
        <View className="flex-1 items-center justify-center gap-10">
          <Text className="text-lg">登录统一身份认证平台，享受一码通服务</Text>
          <Button className="w-1/2" onPress={() => router.push('/(guest)/unified-auth-login')}>
            <Text>前往登录</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
