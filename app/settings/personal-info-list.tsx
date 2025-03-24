import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiV1JwchUserInfo } from '@/api/generate';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
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
  const { data: userData } = usePersistedQuery({
    queryKey: [JWCH_USER_INFO_KEY],
    queryFn: () => getApiV1JwchUserInfo(),
    cacheTime: 7 * 1000 * 60 * 60 * 24, // 缓存 7 天
  });

  // 在组件加载时初始化数据
  useEffect(() => {
    if (userData) {
      setUserInfo(userData.data.data);
    }
  }, [userData]);

  return (
    <>
      <Stack.Screen options={{ title: '个人信息收集清单' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            <Text className="mb-2 text-sm text-text-secondary">你可以查阅当前我们对你的个人信息的收集情况。</Text>

            <DescriptionList>
              <DescriptionListRow>
                <DescriptionListTerm>姓名</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.name}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow>
                <DescriptionListTerm>学号</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.stu_id}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow>
                <DescriptionListTerm>性别</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.sex}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow>
                <DescriptionListTerm>生日</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.birthday}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow>
                <DescriptionListTerm>学院</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.college}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow>
                <DescriptionListTerm>年级</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.grade}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow>
                <DescriptionListTerm>专业</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.major}</DescriptionListDescription>
              </DescriptionListRow>
            </DescriptionList>
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
