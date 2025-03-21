/* eslint-disable react-native/no-inline-styles */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { useRedirectWithoutHistory } from '@/hooks/useRedirectWithoutHistory';
import { RELEASE_CHANNEL_KEY } from '@/lib/constants';
import { CourseCache } from '@/lib/course';
import { SSOlogoutAndCleanData } from '@/lib/sso';
import { LocalUser } from '@/lib/user';
import { getWebViewHref } from '@/lib/webview';

// 新建一个下拉选择组件，用于 Android 平台内测计划设置
function ReleaseChannelPicker({
  value,
  onValueChange,
}: {
  value: string | null;
  onValueChange: (val: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null,
  );

  const options = [
    { label: '正式版', value: 'release' },
    { label: 'Beta版', value: 'beta' },
    { label: 'Alpha版', value: 'alpha' },
  ];

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setVisible(false);
  };

  return (
    <>
      <View onLayout={e => setButtonLayout(e.nativeEvent.layout)}>
        <LabelEntry
          leftText="更新通道"
          onPress={() => setVisible(true)}
          rightText={options.find(opt => opt.value === value)?.label}
        />
      </View>

      {visible && buttonLayout && (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={() => setVisible(false)}>
          <Pressable style={{ flex: 1 }} onPress={() => setVisible(false)}>
            <View
              style={{
                position: 'absolute',
                top: buttonLayout.y + buttonLayout.height,
                right: buttonLayout.x + 30,
                width: buttonLayout.width - 200,
                backgroundColor: 'white',
                borderColor: '#ccc',
                borderWidth: 1,
                borderRadius: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  style={{
                    padding: 12,
                    borderBottomWidth: index < options.length - 1 ? 1 : 0,
                    borderBottomColor: '#eee',
                  }}
                >
                  <Text>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

export default function AcademicPage() {
  const redirect = useRedirectWithoutHistory();
  const [releaseChannel, setReleaseChannel] = useState<'release' | 'beta' | 'alpha' | null>('release'); // (仅 Android) 发布渠道

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
    Alert.alert('确认退出', '确认要退出登录吗？(含教务系统、统一身份认证等全部登录内容）', [
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

  const handleChangeReleaseChannel = () => {
    if (Platform.OS === 'ios') {
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
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      AsyncStorage.getItem(RELEASE_CHANNEL_KEY).then(value => {
        setReleaseChannel((value as 'release' | 'beta' | 'alpha') || 'release');
      });
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && releaseChannel) {
      AsyncStorage.setItem(RELEASE_CHANNEL_KEY, releaseChannel);
    }
  }, [releaseChannel]);

  return (
    <>
      <Stack.Screen options={{ title: '设置' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            {/* 菜单列表 */}
            <Text className="mb-2 text-sm text-text-secondary">基本</Text>

            <Link href="/settings/notifications" asChild>
              <LabelEntry leftText="通知推送" />
            </Link>
            <Link href="/settings/appearance" asChild>
              <LabelEntry leftText="主题换肤" />
            </Link>
            <LabelEntry leftText="清除数据" onPress={handleClearData} />
            <LabelEntry leftText="退出登录(全部)" onPress={handleLogout} />
            <LabelEntry leftText="退出登录(仅统一身份认证)" onPress={handleSSOLogout} />

            <Text className="mb-2 mt-4 text-sm text-text-secondary">隐私</Text>

            <Link href="/settings/permissions" asChild>
              <LabelEntry leftText="隐私权限设置" />
            </Link>
            <Link href="/settings/personal-info-list" asChild>
              <LabelEntry leftText="个人信息收集清单" />
            </Link>
            <Link
              href={getWebViewHref({ url: 'https://fzuhelper.west2.online/onekey/FZUHelper.html#privacy' })}
              asChild
            >
              <LabelEntry leftText="第三方信息共享清单" />
            </Link>

            {/* <Text className="mb-2 mt-4 text-sm text-text-secondary">Developer</Text> */}
            {/* <LabelEntry leftText="开发者工具" onPress={() => router.push('/devtools')} /> */}

            <Text className="mb-2 mt-4 text-sm text-text-secondary">其他</Text>

            {Platform.OS === 'android' && (
              <ReleaseChannelPicker
                value={releaseChannel}
                onValueChange={(val: string) => setReleaseChannel(val as 'release' | 'beta' | 'alpha')}
              />
            )}
            {Platform.OS === 'ios' && (
              <LabelEntry leftText="TestFlight 内测计划" onPress={handleChangeReleaseChannel} />
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
