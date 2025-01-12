import YMTLogin, { IdentifyRespData, PayCodeRespData } from '@/lib/ymt-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function YiMaTongPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const ymtLogin = new YMTLogin();

  const [PayCodes, setPayCodes] = useState<PayCodeRespData[]>([]);
  const [IdentifyCode, setIdentifyCode] = useState<IdentifyRespData | null>(null);

  // 尝试读取本地数据
  useEffect(() => {
    async function getLocalData() {
      try {
        const storedAccessToken = await AsyncStorage.getItem('accessToken');
        const storedName = await AsyncStorage.getItem('name');

        setAccessToken(storedAccessToken);
        setName(storedName);

        console.log('读取本地数据成功:', storedAccessToken, storedName);
      } catch (error) {
        console.error('读取本地数据失败:', error);
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('name');
      }
    }

    getLocalData();
  }, []);

  // accessToken 变化时自动刷新
  useEffect(() => {
    refresh();
  }, [accessToken]);

  async function refresh() {
    if (accessToken) {
      await ymtLogin.getPayCode(accessToken).then(payCodes => {
        console.log(payCodes);
        setPayCodes(payCodes);
      });

      await ymtLogin.getIdentifyCode(accessToken).then(identifyCode => {
        console.log(identifyCode);
        setIdentifyCode(identifyCode);
      });
    }
  }

  if (!accessToken) {
    return (
      <Link href="/qrcode-login-page" asChild>
        <Button title="Login" />
      </Link>
    );
  } else {
    return (
      <>
        <Button
          title="Logout"
          onPress={() => {
            AsyncStorage.removeItem('accessToken');
            AsyncStorage.removeItem('name');
            setAccessToken(null);
            setName(null);
          }}
        />
        <Button title="Refresh" onPress={refresh} />

        {PayCodes.length > 0 && <QRCode value={PayCodes[0].prePayId} size={200} />}
        {IdentifyCode && <QRCode value={IdentifyCode.content} size={200} color={IdentifyCode.color} />}
      </>
    );
  }
}
