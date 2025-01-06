import { useState } from 'react';
import { Button, ScrollView, Text, TextInput, View } from 'react-native';

import { ThemedView } from '@/components/ThemedView';

export default function YmtPage() {
  const [user_id, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [access_token, setAccessToken] = useState('');
  const [pay_code, setPayCode] = useState([
    { devId: '', expiredTime: '', payAcctId: '', payPrdCode: '', prePayId: '' },
  ]);

  async function login(user_id: string, password: string) {
    const token_resp = await fetch('https://oss.fzu.edu.cn/api/qr/login/getAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isNotPermanent: false,
        username: user_id,
        password: password,
      }),
    });
    if (token_resp.ok) {
      const data = await token_resp.json();
      console.log(data);
      setAccessToken(data.data.access_token);
    }
  }
  async function getPayCode(access_token: string) {
    const pay_resp = await fetch('https://oss.fzu.edu.cn/api/qr/deal/getQrCode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + access_token,
      },
    });
    if (pay_resp.ok) {
      const data = await pay_resp.json();
      console.log(data);
      setPayCode(data.data);
    }
  }

  return (
    <>
      <ThemedView>
        <ThemedView>
          <TextInput value={user_id} onChangeText={setUserId} placeholder="用户名" />
          <TextInput value={password} onChangeText={setPassword} placeholder="密码" secureTextEntry />
          <Button title="登录" onPress={() => login(user_id, password)} />

          <Text>access_token: {access_token}</Text>
          <Button title="获取支付码" onPress={() => getPayCode(access_token)} />

          <ScrollView>
            {pay_code.map((code, index) => (
              <View key={index} style={{ backgroundColor: '#add8e6', margin: 5, padding: 5 }}>
                <Text>devId: {code.devId}</Text>
                <Text>expiredTime: {code.expiredTime}</Text>
                <Text>payAcctId: {code.payAcctId}</Text>
                <Text>payPrdCode: {code.payPrdCode}</Text>
                <Text>
                  prePayId: {code.prePayId.slice(0, 3)}*****{code.prePayId.slice(15)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </ThemedView>
      </ThemedView>
    </>
  );
}
