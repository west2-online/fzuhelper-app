import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import YMTLogin, { IdentifyRespData, PayCodeRespData } from '@/lib/ymt-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
export default function YiMaTongPage() {
  const ymtLogin = useMemo(() => new YMTLogin(), []);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [PayCodes, setPayCodes] = useState<PayCodeRespData[]>();
  const [IdentifyCode, setIdentifyCode] = useState<IdentifyRespData>();
  const [currentTab, setCurrentTab] = useState('消费码');

  // 初始化时读取本地数据
  useEffect(() => {
    // 读取本地数据
    async function getLocalData() {
      try {
        const storedAccessToken = await AsyncStorage.getItem('accessToken');

        setAccessToken(storedAccessToken);

        console.log('读取本地数据成功:', storedAccessToken);
        refresh();
      } catch (error) {
        console.error('读取本地数据失败:', error);
        await AsyncStorage.removeItem('accessToken');
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
  }, []);

  // accessToken 变化时自动刷新
  useEffect(() => {
    refresh();
  }, [accessToken]);

  async function refresh() {
    if (accessToken) {
      try {
        const payCodes = await ymtLogin.getPayCode(accessToken);
        setPayCodes(payCodes);

        const identifyCode = await ymtLogin.getIdentifyCode(accessToken);
        setIdentifyCode(identifyCode);
      } catch (error: any) {
        console.error('刷新失败:', error);
        Alert.alert('刷新失败', error.message);
      }
    }
  }
  async function logout() {
    Alert.alert(
      '确认登出',
      '您确定要登出吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定',
          onPress: async () => {
            ymtLogin.logout();
            setAccessToken(null);
          },
        },
      ],
      { cancelable: false },
    );
  }

  function renderQRCodeCard(title: string, codeContent: string, codeColor: string) {
    return (
      <Card>
        <CardHeader className="">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {currentTime.toLocaleDateString() + ' '}
            {currentTime.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-row justify-center gap-4">
          <QRCode value={codeContent} size={340} color={codeColor} />
        </CardContent>

        <CardFooter className="flex-row gap-4">
          <Button onPress={logout} className="width-full flex-5">
            <Text>登出</Text>
          </Button>
          <Button onPress={refresh} className="width-full flex-1 bg-blue-500">
            <Text>刷新</Text>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  if (!accessToken) {
    // 未登录
    return (
      <Button onPress={() => router.push('/qrcode-login-page')}>
        <Text>Login</Text>
      </Button>

      // <Link href="/qrcode-login-page" asChild>
      //   <Button title="Login" />
      // </Link>
    );
  } else {
    // 已登录
    return (
      <View className="flex-1">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mx-auto max-w-[400px] gap-1.5">
          <TabsContent value="消费码">
            {PayCodes ? renderQRCodeCard('消费码', PayCodes[0].prePayId, '#000000') : <Text>Loading...</Text>}
          </TabsContent>

          <TabsContent value="认证码">
            {IdentifyCode ? (
              renderQRCodeCard('认证码', IdentifyCode.content, IdentifyCode.color)
            ) : (
              <Text>Loading...</Text>
            )}
          </TabsContent>

          <TabsList className="w-full flex-row">
            <TabsTrigger value="消费码" className="flex-1">
              <Text>消费码</Text>
            </TabsTrigger>
            <TabsTrigger value="认证码" className="flex-1">
              <Text>认证码</Text>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </View>
    );
  }
}
