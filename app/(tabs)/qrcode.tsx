import YMTLogin, { IdentifyRespData, PayCodeRespData } from '@/lib/ymt-login';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// 定义常量
const MAIN_COLOR = 'lightblue';

export default function YiMaTongPage() {
  const ymtLogin = useMemo(() => new YMTLogin(), []);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [PayCodes, setPayCodes] = useState<PayCodeRespData[]>([]);
  const [IdentifyCode, setIdentifyCode] = useState<IdentifyRespData | null>(null);
  const [selectedCode, setSelectedCode] = useState<'消费码' | '认证码'>('消费码');

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

  function renderQRCode() {
    if (selectedCode === '消费码' && PayCodes.length > 0) {
      return <QRCode value={PayCodes[0].prePayId} size={300} />;
    } else if (IdentifyCode?.content) {
      return <QRCode value={IdentifyCode.content} size={300} color={IdentifyCode.color ?? 'green'} />;
    }
    return <Text>Loading...</Text>;
  }

  if (!accessToken) {
    // 未登录
    return (
      <Link href="/qrcode-login-page" asChild>
        <Button title="Login" />
      </Link>
    );
  } else {
    // 已登录
    return (
      <>
        {/* 主功能区 */}
        <View style={styles.mainArea}>
          {/* 二维码容器 */}
          <View style={styles.qrcodeContainer}>
            <View style={styles.qrcode}>{renderQRCode()}</View>
          </View>
          <Text style={styles.time}>
            {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
          </Text>
          {/* 两个切换按钮 */}
          <View style={styles.selectButtonContainer}>
            <TouchableOpacity style={styles.selectButton} onPress={() => setSelectedCode('消费码')}>
              {selectedCode === '消费码' && <Ionicons name="checkmark" size={20} />}
              <Text>消费码</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectButton} onPress={() => setSelectedCode('认证码')}>
              {selectedCode === '认证码' && <Ionicons name="checkmark" size={20} />}
              <Text>认证码</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 辅功能区 */}
        <View style={styles.quickActionArea}>
          {/* 刷新 */}
          <TouchableOpacity style={styles.quickActionButton} onPress={refresh}>
            <Ionicons name="refresh" color="#fff" style={styles.leftIcon} />
            <Text style={styles.text}>刷新</Text>
            <Ionicons name="arrow-forward" color="#fff" style={styles.rightIcon} />
          </TouchableOpacity>

          {/* 登出 */}
          <TouchableOpacity style={styles.quickActionButton} onPress={logout}>
            <Ionicons name="log-out" color="#fff" style={styles.leftIcon} />
            <Text style={styles.text}>登出</Text>
            <Ionicons name="arrow-forward" color="#fff" style={styles.rightIcon} />
          </TouchableOpacity>
        </View>
      </>
    );
  }
}

// 样式
const styles = StyleSheet.create({
  // 主功能区
  mainArea: {},
  // 二维码容器
  qrcodeContainer: {
    alignItems: 'center', // 水平居中
    padding: 10,
    borderRadius: 10,
  },
  // 二维码
  qrcode: {
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
  // 时间
  time: {
    textAlign: 'center',
    fontSize: 20,
  },
  // 选择按钮容器
  selectButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
  },
  // 选择按钮
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: 15,
    margin: 10,
    borderRadius: 10,
    backgroundColor: MAIN_COLOR,
  },
  // 辅功能区
  quickActionArea: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 10,
  },
  // 功能按钮
  quickActionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    margin: 10,
    borderRadius: 10,
    backgroundColor: MAIN_COLOR,
  },
  // 左图标
  leftIcon: {
    flex: 1,
    marginRight: 10,
    fontSize: 30,
    color: 'black',
  },
  // 中文字
  text: {
    flex: 10,
    marginBottom: 3, //视觉居中
    fontSize: 20,
    color: 'black',
    justifyContent: 'center',
  },
  // 右图标
  rightIcon: {
    flex: 1,
    marginLeft: 10,
    fontSize: 30,
    color: 'black',
  },
});