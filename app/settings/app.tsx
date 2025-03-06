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
import { LocalUser } from '@/lib/user';
import { pushToWebViewNormal } from '@/lib/webview';
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
          await CourseCache.clear(); // 清除课程缓存
          await LocalUser.clear(); // 清除本地用户
          await AsyncStorage.clear(); // 清空 AsyncStorage
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
            await CourseCache.clear();
            await LocalUser.clear();
            await AsyncStorage.clear(); // 清空 AsyncStorage
            redirect('/(guest)');
          } catch (error) {
            console.error('Error clearing storage:', error);
            Alert.alert('清理用户数据失败', '无法清理用户数据');
          }
        },
      },
    ]);
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

            <LabelEntry leftText="隐私权限设置" onPress={() => router.push('/settings/permissions')} />
            <LabelEntry leftText="个人信息收集清单" onPress={() => router.push('/settings/personal-info-list')} />
            <LabelEntry
              leftText="第三方信息共享清单"
              onPress={() =>
                pushToWebViewNormal(
                  'https://iosfzuhelper.west2online.com/onekey/FZUHelper.html#third-party',
                  '第三方信息共享清单',
                )
              }
            />

            {/* <Text className="mb-2 mt-4 text-sm text-text-secondary">Developer</Text> */}
            {/* <LabelEntry leftText="开发者工具" onPress={() => router.push('/devtools')} /> */}

            <Text className="mb-2 mt-4 text-sm text-text-secondary">其他</Text>

            <LabelEntry leftText="关于福uu" onPress={() => router.push('/common/about')} />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
