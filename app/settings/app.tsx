import { CommonSettingsManager } from '@/lib/common-settings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Link, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import LabelSwitch from '@/components/label-switch';
import { queryClient } from '@/components/query-provider';
import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { SSOlogoutAndCleanData } from '@/lib/sso';
import { LocalUser, logoutUser } from '@/lib/user';
import { getWebViewHref } from '@/lib/webview';
import { getReleaseChannel, storeReleaseChannel } from '@/utils/android-update';

export default function SettingPage() {
  const redirect = useRedirectWithoutHistory();
  const [releaseChannel, setReleaseChannel] = useState<string | null>('release'); // (仅 Android) 发布渠道

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
          await AsyncStorage.clear(); // 清空 AsyncStorage
          queryClient.clear(); // 清除网络请求缓存
          await LocalUser.clear(); // 清除本地用户
          await FileSystem.deleteAsync(FileSystem.cacheDirectory as string); // 清除系统缓存
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
    Alert.alert('确认退出', '确认要退出登录吗？（含教务系统、统一身份认证等全部登录内容）', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          try {
            await logoutUser();
            await SSOlogoutAndCleanData();
            redirect('/(guest)');
          } catch (error) {
            console.error('Error clearing storage:', error);
            Alert.alert('清理用户数据失败', '无法清理用户数据');
          }
        },
      },
    ]);
  };

  const handleSSOLogout = () => {
    Alert.alert('确认退出', '您确定要退出统一身份认证账户（非教务系统，该账户包含学习中心、一码通等内容）吗？', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '确定',
        onPress: async () => {
          try {
            await SSOlogoutAndCleanData();
            toast.success('统一身份认证已退出并清除数据');
          } catch (error) {
            console.error('Error clearing storage:', error);
            Alert.alert('清理用户数据失败', '无法清理用户数据');
          }
        },
      },
    ]);
  };

  const handleChangeReleaseChannelIOS = () => {
    Alert.alert(
      '内测计划',
      '苹果内测版 App 由 TestFlight 统一管理，点击确认打开内测指引，如需重新回归正式版可以在 App Store 中重新下载',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定',
          onPress: async () => {
            Linking.openURL('https://testflight.apple.com/join/UubMBYAm');
          },
        },
      ],
    );
  };

  const handleChangeReleaseChannelAndroid = () => {
    const newChannel = releaseChannel === 'beta' ? 'release' : 'beta';
    setReleaseChannel(newChannel);
    storeReleaseChannel(newChannel);
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      getReleaseChannel().then(setReleaseChannel);
    }
  }, []);

  // 添加重置忽略设置的函数
  const handleResetIgnoredAlerts = () => {
    Alert.alert('确认重置', '是否要重置所有已忽略的提示？重置后，所有提示都将再次显示。', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '重置',
        onPress: async () => {
          await CommonSettingsManager.resetAllIgnoredAlerts();
          toast.success('已重置所有忽略的提示');
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: '设置' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8" contentContainerClassName="pt-8">
          <SafeAreaView edges={['bottom']}>
            {/* 菜单列表 */}
            <Text className="mb-2 text-sm text-text-secondary">基本</Text>

            <Link href="/settings/notifications" asChild>
              <LabelEntry leftText="通知推送" />
            </Link>
            <Link href="/settings/appearance" asChild>
              <LabelEntry leftText="主题换肤" />
            </Link>
            <Link href="/settings/course" asChild>
              <LabelEntry leftText="课程表设置" />
            </Link>
            <LabelEntry leftText="清除数据" onPress={handleClearData} />
            <LabelEntry leftText="退出登录（全部）" onPress={handleLogout} />
            <LabelEntry leftText="退出登录（统一身份认证）" onPress={handleSSOLogout} />
            <LabelEntry leftText="重置忽略的提示" onPress={handleResetIgnoredAlerts} />

            <Text className="mb-2 mt-4 text-sm text-text-secondary">隐私</Text>

            <Link href="/settings/permissions" asChild>
              <LabelEntry leftText="隐私权限设置" />
            </Link>
            <Link href="/settings/personal-info-list" asChild>
              <LabelEntry leftText="个人信息收集清单" />
            </Link>
            <Link
              href={getWebViewHref({ url: 'https://fzuhelper.west2.online/onekey/FZUHelper.html#third-party' })}
              asChild
            >
              <LabelEntry leftText="第三方信息共享清单" />
            </Link>

            {/* <Text className="mb-2 mt-4 text-sm text-text-secondary">Developer</Text> */}
            {/* <LabelEntry leftText="开发者工具" onPress={() => router.push('/devtools')} /> */}

            <Text className="mb-2 mt-4 text-sm text-text-secondary">其他</Text>

            {Platform.OS === 'android' && (
              <LabelSwitch
                label="加入内测计划"
                value={releaseChannel === 'beta'}
                onValueChange={handleChangeReleaseChannelAndroid}
              />
            )}
            {Platform.OS === 'ios' && (
              <LabelEntry leftText="TestFlight 内测计划" onPress={handleChangeReleaseChannelIOS} />
            )}

            <Link href="/common/about" asChild>
              <LabelEntry leftText="关于福uu" />
            </Link>
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
