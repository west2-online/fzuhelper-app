import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, Stack } from 'expo-router';
import { Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { CourseCache } from '@/lib/course';
import { LocalUser } from '@/lib/user';
import { getWebViewHref } from '@/lib/webview';

export default function AcademicPage() {
  const redirect = useRedirectWithoutHistory();

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
      <Stack.Screen options={{ title: '设置', headerTransparent: true }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            {/* 菜单列表 */}
            <Text className="mb-2 text-sm text-text-secondary">基本</Text>

            <Link href="/settings/notifications" asChild>
              <LabelEntry leftText="通知推送" />
            </Link>
            <Link href="/settings/appearance" asChild>
              <LabelEntry leftText="自定义皮肤" />
            </Link>
            <LabelEntry leftText="清除数据" onPress={handleClearData} />
            <LabelEntry leftText="退出登录" onPress={handleLogout} />

            <Text className="mb-2 mt-4 text-sm text-text-secondary">隐私</Text>

            <Link href="/settings/permissions" asChild>
              <LabelEntry leftText="隐私权限设置" />
            </Link>
            <Link href="/settings/personal-info-list" asChild>
              <LabelEntry leftText="个人信息收集清单" />
            </Link>
            <Link
              href={getWebViewHref({ url: 'https://iosfzuhelper.west2online.com/onekey/FZUHelper.html#privacy' })}
              asChild
            >
              <LabelEntry leftText="第三方信息共享清单" />
            </Link>

            {/* <Text className="mb-2 mt-4 text-sm text-text-secondary">Developer</Text> */}
            {/* <LabelEntry leftText="开发者工具" onPress={() => router.push('/devtools')} /> */}

            <Text className="mb-2 mt-4 text-sm text-text-secondary">其他</Text>

            <Link href="/common/about" asChild>
              <LabelEntry leftText="关于福uu" />
            </Link>
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
