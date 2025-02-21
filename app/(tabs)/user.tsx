import AsyncStorage from '@react-native-async-storage/async-storage';
import { Href, Link, router, Tabs } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ImageSourcePropType, ScrollView, View } from 'react-native';

import { Icon } from '@/components/Icon';
import LabelIconEntry from '@/components/label-icon-entry';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { getApiV1JwchUserInfo } from '@/api/generate';
import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { JWCH_USER_INFO_KEY } from '@/lib/constants';
import { clearUserStorage } from '@/utils/user';

import AvatarDefault from '@/assets/images/my/avatar_default.png';
import CalendarIcon from '@/assets/images/my/ic_calendar.png';
import EcardIcon from '@/assets/images/my/ic_ecard.png';
import HelpIcon from '@/assets/images/my/ic_help.png';

export default function HomePage() {
  const { handleError } = useSafeResponseSolve();
  const redirect = useRedirectWithoutHistory();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    stu_id: '', // 学号
    birthday: '', // 生日
    name: '', // 姓名
    sex: '', // 性别
    college: '', // 所属学院
    grade: '', // 所属年级
    major: '', // 所属专业
  });

  interface MenuItem {
    icon: ImageSourcePropType;
    name: string; // 菜单项名称
    link: Href; // 跳转链接
  }

  // 菜单项数据
  const menuItems: MenuItem[] = [
    {
      icon: CalendarIcon,
      name: '校历',
      link: '/my/credits' as Href,
    },
    {
      icon: HelpIcon,
      name: '帮助与反馈',
      link: '/my/plan' as Href,
    },
    {
      icon: EcardIcon,
      name: '关于我们',
      link: '/(guest)/about' as Href,
    },
  ];

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
      const fetchedInfo = result.data.data;
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
            redirect('/(guest)/academic-login');
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
    <>
      <Tabs.Screen
        options={{
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => <Icon href="/settings/app" name="settings-outline" size={24} className="mr-4" />,
        }}
      />

      <PageContainer>
        <ScrollView>
          <View className="flex-row items-center p-8">
            <Image source={AvatarDefault} className="mr-6 h-24 w-24 rounded-full" />
            <View>
              <Text className="text-xl font-bold">{userInfo.name}</Text>
              <Text className="text-text-secondary mt-2 text-sm">这是一条签名</Text>
            </View>
          </View>

          <View className="h-full rounded-tr-4xl bg-card px-8">
            <View className="mt-6">
              <View className="w-full flex-row justify-between">
                <Text>{userInfo.college}</Text>
                <Text>{userInfo.stu_id}</Text>
              </View>
              <View className="mt-2 w-full flex-row justify-between">
                <Text className="text-text-secondary">2024年1学期</Text>
                <Text className="text-text-secondary">第 22 周</Text>
              </View>
            </View>

            {/* 菜单列表 */}
            <View className="mt-4 space-y-4">
              {menuItems.map(item => (
                <LabelIconEntry icon={item.icon} label={item.name} onPress={() => router.push(item.link)} />
              ))}
            </View>

            {/* 按钮部分，调试用，后续移除 */}
            <View className="mt-6">
              <Button onPress={getUserInfo} disabled={isRefreshing} className="mb-4">
                <Text className="text-white">{isRefreshing ? '刷新中...' : '刷新个人信息'}</Text>
              </Button>
              <Button onPress={logout} className="mb-4">
                <Text className="text-white">退出当前账户</Text>
              </Button>
              <Link href="/devtools" asChild>
                <Button>
                  <Text className="text-white">开发者选项</Text>
                </Button>
              </Link>
            </View>
          </View>
        </ScrollView>
      </PageContainer>
    </>
  );
}
