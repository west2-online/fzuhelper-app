import { useState } from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function YmtPage() {
  const [account, setUserId] = useState('');
  const [accountPassword, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [payCode, setPayCode] = useState([{ devId: '', expiredTime: '', payAcctId: '', payPrdCode: '', prePayId: '' }]);

  async function login(userId: string, password: string) {
    if (userId === '' || password === '') {
      Alert.alert('登录失败', '用户名和密码不能为空');
      return;
    }

    try {
      const tokenResp = await fetch('https://oss.fzu.edu.cn/api/qr/login/getAccessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isNotPermanent: false,
          username: userId,
          password: password,
        }),
      });

      if (!tokenResp.ok) {
        throw new Error('登录失败');
      }

      const data = await tokenResp.json();
      console.log(data);

      if (data.code !== 0) {
        throw new Error('登录失败: ' + data.msg);
      }

      setAccessToken(data.data.access_token);

      await getPayCode(data.data.access_token);
    } catch (err) {
      console.error('登录错误:', err);
    }
  }

  async function getPayCode(token = accessToken) {
    try {
      const payResp = await fetch('https://oss.fzu.edu.cn/api/qr/deal/getQrCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
      });

      if (!payResp.ok) {
        throw new Error('获取支付码失败');
      }

      const data = await payResp.json();
      console.log(data);
      setPayCode(data.data);
    } catch (err: any) {
      Alert.alert('获取支付码失败', err.message);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {accessToken === '' ? (
          <>
            <TextInput value={account} onChangeText={setUserId} placeholder="用户名" style={styles.input} />
            <TextInput
              value={accountPassword}
              onChangeText={setPassword}
              placeholder="密码"
              secureTextEntry
              style={styles.input}
              onSubmitEditing={() => login(account, accountPassword)}
            />
            <Button title="登录" onPress={() => login(account, accountPassword)} />
          </>
        ) : (
          <View style={styles.qrCodeWrapper}>
            <Text style={styles.welcome}>您好, {account}</Text>
            {/*<Text>access_token: {accessToken}</Text>
            <Text>devId: {payCode[0].devId}</Text>
            <Text>expiredTime: {payCode[0].expiredTime}</Text>
            <Text>payAcctId: {payCode[0].payAcctId}</Text>
            <Text>payPrdCode: {payCode[0].payPrdCode}</Text> */}
            <View style={styles.qrcodeContainer}>
              {payCode[0].prePayId === '' ? null : <QRCode value={payCode[0].prePayId} size={300} />}
            </View>

            <Button title="刷新" onPress={() => login(account, accountPassword)} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  qrCodeWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  qrcodeContainer: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 7,
    elevation: 5,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
});
