import { getApiV1JwchUserInfo } from '@/api/generate';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { JWCH_USER_INFO_KEY } from '@/lib/constants';
import { clearUserStorage } from '@/utils/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

export default function HomePage() {
  const { handleError } = useSafeResponseSolve();
  const redirect = useRedirectWithoutHistory();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    stu_id: '', // 学号
    birthday: '', // 生日
    sex: '', // 性别
    college: '', // 所属学院
    grade: '', // 所属年级
    major: '', // 所属专业
  });

  const userInfoLabels: Record<string, string> = {
    stu_id: '学号',
    birthday: '生日',
    sex: '性别',
    college: '所属学院',
    grade: '所属年级',
    major: '所属专业',
  };

  // 从 AsyncStorage 加载用户信息
  const loadUserInfoFromStorage = useCallback(async () => {
    try {
      const storedData = await AsyncStorage.getItem(JWCH_USER_INFO_KEY);
      if (storedData) {
        setUserInfo(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Failed to load user info from AsyncStorage:', error);
    }
  }, []);

  // 将用户信息保存到 AsyncStorage
  const saveUserInfoToStorage = useCallback(async (info: typeof userInfo) => {
    try {
      await AsyncStorage.setItem(JWCH_USER_INFO_KEY, JSON.stringify(info));
    } catch (error) {
      console.error('Failed to save user info to AsyncStorage:', error);
    }
  }, []);

  // 访问服务器获取用户信息
  const getUserInfo = useCallback(async () => {
    if (isRefreshing) return; // 防止重复点击
    setIsRefreshing(true); // 禁用按钮
    try {
      const result = await getApiV1JwchUserInfo();
      const fetchedInfo = {
        stu_id: result.data.data.stu_id,
        birthday: result.data.data.birthday,
        sex: result.data.data.sex,
        college: result.data.data.college,
        grade: result.data.data.grade,
        major: result.data.data.major,
      };
      setUserInfo(fetchedInfo);
      await saveUserInfoToStorage(fetchedInfo); // 同步到 AsyncStorage
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        Alert.alert('请求失败', data.code + ': ' + data.message);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [handleError, saveUserInfoToStorage, isRefreshing]);

  // 登出
  const logout = useCallback(async () => {
    Alert.alert('确认退出', '确认要退出账号吗？', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearUserStorage();
            redirect('/login');
          } catch (error) {
            console.error('Error clearing storage:', error);
            Alert.alert('清理用户数据失败', '无法清理用户数据');
          }
        },
      },
    ]);
  }, [redirect]);

  // 在组件加载时初始化数据
  useEffect(() => {
    loadUserInfoFromStorage();
  }, [loadUserInfoFromStorage]);

  return (
    <ThemedView className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* 个人信息列表 */}
        <View className="gap-4">
          {Object.entries(userInfo).map(([key, value]) => (
            <View key={key} className="mb-2 flex-row items-center justify-between border-b border-gray-300 pb-2">
              <Text className="capitalize text-gray-500">{userInfoLabels[key] || key}:</Text>
              <Text className="text-black">{value}</Text>
            </View>
          ))}
        </View>

        {/* 按钮部分 */}
        <View className="mt-6">
          <Button onPress={getUserInfo} disabled={isRefreshing} className="mb-4">
            <Text>{isRefreshing ? '刷新中...' : '刷新个人信息'}</Text>
          </Button>
          <Button onPress={logout} className="mb-4">
            <Text>退出当前账户</Text>
          </Button>
          <Link href="/devtools" asChild>
            <Button>
              <Text>开发者选项</Text>
            </Button>
          </Link>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
