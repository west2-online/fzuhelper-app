import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { CourseCache } from '@/lib/course';
import { pushToWebViewNormal } from '@/lib/webview';
import { clearUserStorage } from '@/utils/user';
import { ScrollView } from 'react-native-gesture-handler';

export default function AcademicPage() {
  const redirect = useRedirectWithoutHistory();

  // 通知推送
  const handleNotification = () => {
    router.push('/settings/notifications');
  };

  // 清除数据
  const handleClearData = () => {
    Alert.alert('确认清除', '确认要清除全部数据吗？', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '清除',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          toast.success('清除完成，请重新登录');
          setTimeout(() => {
            redirect('/(guest)');
          }, 1500);
        },
      },
    ]);
  };
  // 登出
  const handleLogout = () => {
    Alert.alert('确认退出', '确认要退出登录吗？', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          try {
            CourseCache.clear();
            await clearUserStorage();
            redirect('/(guest)/academic-login');
          } catch (error) {
            console.error('Error clearing storage:', error);
            Alert.alert('清理用户数据失败', '无法清理用户数据');
          }
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

  // 进入开发者工具
  const handleDeveloperTools = () => {
    router.push('/devtools');
  };

  return (
    <>
      <Stack.Screen options={{ title: '设置' }} />

      <PageContainer>
        <ScrollView className="flex-1 bg-background px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            {/* 菜单列表 */}
            <Text className="mb-2 text-sm text-text-secondary">基本</Text>

            <LabelEntry leftText="推送通知" onPress={handleNotification} />
            <LabelEntry leftText="清除数据" onPress={handleClearData} />
            <LabelEntry leftText="退出登录" onPress={handleLogout} />

            <Text className="mb-2 mt-4 text-sm text-text-secondary">隐私</Text>

            <LabelEntry leftText="隐私权限设置" onPress={handlePrivacyPermission} />
            <LabelEntry leftText="个人信息收集清单" onPress={handlePersonalInfoList} />
            <LabelEntry leftText="第三方信息共享清单" onPress={handleThirdPartyInfoList} />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
