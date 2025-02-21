import { Stack } from 'expo-router';

import LabelEntry from '@/components/LabelEntry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';

export default function AcademicPage() {
  // 通知推送
  const handleNotification = () => {
    router.push('/settings/notifications');
  };

  // 关于我们
  const handleAboutUs = () => {
    router.push('/(guest)/about');
  };

  // 清除数据
  const handleClearData = () => {
    console.log('清除数据');
  };

  // 隐私权限设置
  const handlePrivacyPermission = () => {
    router.push('/settings/privacy-permission');
  };

  // 个人信息搜集清单
  const handlePersonalInfoList = () => {
    console.log('个人信息搜集清单');
  };

  // 第三方信息共享清单
  const handleThirdPartyInfoList = () => {
    console.log('第三方信息共享清单');
  };

  return (
    <>
      <Stack.Screen options={{ title: '设置' }} />

      <PageContainer>
        <ScrollView className="flex-1 bg-background px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            {/* 菜单列表 */}
            <Text className="mb-2 text-sm text-foreground">基本</Text>

            <LabelEntry leftText="通知推送" onPress={handleNotification} />
            <LabelEntry leftText="清除数据" onPress={handleClearData} />

            <Text className="mb-2 mt-4 text-sm text-foreground">隐私</Text>

            <LabelEntry leftText="隐私权限设置" onPress={handlePrivacyPermission} />
            <LabelEntry leftText="个人信息搜集清单" onPress={handlePersonalInfoList} />
            <LabelEntry leftText="第三方信息共享清单" onPress={handleThirdPartyInfoList} />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
