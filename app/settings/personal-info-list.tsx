import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiV1JwchUserInfo } from '@/api/generate';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
import useApiRequest from '@/hooks/useApiRequest';

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

  const { data: userData } = useApiRequest(getApiV1JwchUserInfo);

  // 在组件加载时初始化数据
  useEffect(() => {
    if (userData) {
      setUserInfo(userData);
    }
  }, [userData]);

  return (
    <>
      <Stack.Screen options={{ title: '个人信息收集清单' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            <Text className="mb-6 text-sm text-text-secondary">你可以查阅当前我们对你的个人信息的收集情况。</Text>

            <DescriptionList className="gap-6">
              <DescriptionListRow className="px-0">
                <DescriptionListTerm>姓名</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.name}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow className="px-0">
                <DescriptionListTerm>学号</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.stu_id}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow className="px-0">
                <DescriptionListTerm>性别</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.sex}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow className="px-0">
                <DescriptionListTerm>生日</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.birthday}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow className="px-0">
                <DescriptionListTerm>学院</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.college}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow className="px-0">
                <DescriptionListTerm>年级</DescriptionListTerm>
                <DescriptionListDescription>{userInfo.grade}</DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow className="px-0">
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
