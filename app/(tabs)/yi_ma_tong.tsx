import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
export default function YiMaTongPage() {
  // 初始化变量
  const [account, setUserId] = useState('');
  const [accountPassword, setPassword] = useState('');
  const [name, setName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [accessToken, setAccessToken] = useState('');
  const [payCode, setPayCode] = useState([{ devId: '', expiredTime: '', payAcctId: '', payPrdCode: '', prePayId: '' }]);

  // 尝试读取本地数据
  useEffect(() => {
    async function getLocalData() {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          setAccessToken(token);
          console.log('已自动登录 accessToken:', token);
        }
        const storedName = await AsyncStorage.getItem('name');
        if (storedName) {
          setName(storedName);
          console.log('已自动登录 Name:', storedName);
        }
      } catch (error) {
        console.error('读取本地数据失败:', error);
      }
    }

    getLocalData();
  }, []);

  // accessToken 变化时自动刷新
  useEffect(() => {
    if (accessToken !== '') {
      refresh();
    }
  }, [accessToken]);

  // 定时更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 登录函数
  async function login(userId: string, password: string) {
    if (userId === '' || password === '') {
      Alert.alert('登录失败', '用户名和密码不能为空');
      return;
    }

    try {
      const response = await fetch('https://oss.fzu.edu.cn/api/qr/login/getAccessToken', {
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

      if (!response.ok) {
        throw new Error('远端服务异常');
      }

      const data = await response.json();
      console.log(data);

      if (data.code !== 0) {
        throw new Error(data.msg);
      }

      // 保存数据
      setAccessToken(data.data.access_token);
      setName(data.data.name);
      await AsyncStorage.setItem('accessToken', data.data.access_token);
      await AsyncStorage.setItem('name', data.data.name);
      await getPayCode();
    } catch (err: any) {
      Alert.alert('登录失败', err.message);
    }
  }

  // 获取支付码函数
  async function getPayCode() {
    if (accessToken === '') {
      return;
    }

    try {
      const response = await fetch('https://oss.fzu.edu.cn/api/qr/deal/getQrCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken,
        },
      });

      if (!response.ok) {
        throw new Error('远端服务异常');
      }

      if (response.status === 401) {
        setAccessToken('');
        await AsyncStorage.removeItem('accessToken');
        throw new Error('登录已过期');
      }

      const data = await response.json();
      setPayCode(data.data);
      console.log(data);
    } catch (err: any) {
      Alert.alert('获取支付码失败。\n', err.message);
    }
  }

  // 刷新
  async function refresh() {
    await getPayCode();
  }

  async function logout() {
    setAccessToken('');
    setName('');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('name');
  }

  // 渲染
  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
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
            <Text style={styles.welcome}>您好, {name}</Text>
            <Text style={styles.time}>{currentTime.toLocaleTimeString()}</Text>
            <View style={styles.qrcodeContainer}>
              {payCode[0].prePayId === '' ? <Text>Loading</Text> : <QRCode value={payCode[0].prePayId} size={300} />}
            </View>
            <Button title="退出登录" onPress={logout} />
          </View>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.floatingButton} onPress={() => refresh()}>
        <Ionicons name="refresh" size={30} color="#fff" />
      </TouchableOpacity>
    </>
  );
}

// 样式
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
  time: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  qrcodeContainer: {
    margin: 10,
    padding: 10,
    // 居中
    alignItems: 'center',
    justifyContent: 'center',
    width: 350,
    height: 350,
    // 边框
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 7,
    // 圆角
    elevation: 5,
  },
  floatingButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#009688',
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 30,
    borderRadius: 5,
    elevation: 8,
  },
});
