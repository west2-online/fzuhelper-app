import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pushToWebViewNormal } from '@/lib/webview';
import { ScrollView } from 'react-native-gesture-handler';

export default function AcademicPage() {
  // 通知推送
  const handleNotification = () => {
    router.push('/settings/notifications');
  };

  // 清除数据
  const handleClearData = () => {
    Alert.alert('确认清除', '确认要清除全部数据吗？之后需要重新登录 APP', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          Alert.alert('清除成功', '数据已清除，请重新登录 APP');
        },
      },
    ]);
  };

  // 隐私权限设置
  const handlePrivacyPermission = () => {
    router.push('/settings/permissions');
  };

  // 个人信息收集清单
  const handlePersonalInfoList = () => {
    router.push('/settings/personal-info-list');
  };

  // 第三方信息共享清单
  const handleThirdPartyInfoList = () => {
    pushToWebViewNormal('https://iosfzuhelper.west2online.com/onekey/FZUHelper.html#third-party', '第三方信息共享清单');
  };

  return (
    <>
      <Stack.Screen options={{ title: '设置' }} />

      <PageContainer>
        <ScrollView className="flex-1 bg-background px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            {/* 菜单列表 */}
            <Text className="text-text-secondary mb-2 text-sm">基本</Text>

            <LabelEntry leftText="通知推送" onPress={handleNotification} />
            <LabelEntry leftText="清除数据" onPress={handleClearData} />

            <Text className="text-text-secondary mb-2 mt-4 text-sm">隐私</Text>

            <LabelEntry leftText="隐私权限设置" onPress={handlePrivacyPermission} />
            <LabelEntry leftText="个人信息收集清单" onPress={handlePersonalInfoList} />
            <LabelEntry leftText="第三方信息共享清单" onPress={handleThirdPartyInfoList} />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
