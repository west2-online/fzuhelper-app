import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import YMTLogin, { IdentifyRespData, PayCodeRespData } from '@/lib/ymt-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
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
      } catch (error: any) {
        console.error('刷新失败:', error);
        Alert.alert('刷新失败', error.message);
      }
    }
  }, [accessToken, ymtLogin]);

  // 初始化时读取本地数据
  useEffect(() => {
    // 读取本地数据
    async function getLocalData() {
      try {
        const storedAccessToken = await AsyncStorage.getItem('accessToken');
        const storedName = await AsyncStorage.getItem('name');

        setAccessToken(storedAccessToken);
        setName(storedName);

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
  }, [accessToken, refresh]);

  // accessToken 变化时自动刷新
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        // 未登录，跳转到登录页面
        router.push('/(guest)/unified-auth-login');
      }
    };
    checkLoginStatus();
    refresh();
  }, [refresh, accessToken]);

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

  function renderQRCodeCard(title: string, codeContent: string | null, codeColor: string) {
    return (
      <Card>
        <CardHeader className="">
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
            <Text>登出</Text>
          </Button>
          <Button onPress={refresh} className="width-full flex-1 bg-blue-500">
            <Text>刷新</Text>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  return (
    <View className="flex-1">
      {/* Tabs 组件 */}
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

          <TabsContent
            value="认证码"
            className="flex-1 items-center justify-center" // 让内容居中并占满空间
          >
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
    </View>
  );
}
