import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { JWCH_USER_INFO_KEY } from '@/lib/constants';

export default function PersonalInfoListPage() {
  const [userInfo, setUserInfo] = useState({
    stu_id: '', // 学号
    birthday: '', // 生日
    name: '', // 姓名
    sex: '', // 性别
    college: '', // 所属学院
    grade: '', // 所属年级
    major: '', // 所属专业
  });

  // 从 AsyncStorage 加载用户信息
  const loadUserInfoFromStorage = useCallback(async () => {
    try {
      const storedData = await AsyncStorage.getItem(JWCH_USER_INFO_KEY);
      if (storedData) {
        setUserInfo(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Failed to load user info from AsyncStorage:', error);
      toast.error('加载用户信息失败');
    }
  }, []);

  // 在组件加载时初始化数据
  useEffect(() => {
    loadUserInfoFromStorage();
  }, [loadUserInfoFromStorage]);

  return (
    <>
      <Stack.Screen options={{ title: '个人信息搜集清单' }} />

      <PageContainer>
        <ScrollView className="flex-1 bg-background px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            <Text className="mb-2 text-sm text-text-secondary">你可以查阅当前我们对你的个人信息的搜集情况</Text>

            <LabelEntry leftText="姓名" rightText={userInfo.name} disabled />
            <LabelEntry leftText="学号" rightText={userInfo.stu_id} disabled />
            <LabelEntry leftText="性别" rightText={userInfo.sex} disabled />
            <LabelEntry leftText="生日" rightText={userInfo.birthday} disabled />
            <LabelEntry leftText="学院" rightText={userInfo.college} disabled />
            <LabelEntry leftText="年级" rightText={userInfo.grade} disabled />
            <LabelEntry leftText="专业" rightText={userInfo.major} disabled />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
