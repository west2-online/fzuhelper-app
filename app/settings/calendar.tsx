import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { Link, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/label-entry';
import LabelSwitch from '@/components/label-switch';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { getApiV1JwchCourseCalendarToken } from '@/api/generate';
import type { CourseSetting } from '@/api/interface';
import { useUpdateEffect } from '@/hooks/use-update-effect';
import {
  CALENDAR_SUBSCRIPTION_PREFIX,
  CALENDAR_SUBSCRIPTION_TOKEN_KEY,
  COURSE_SETTINGS_KEY,
  EXPIRE_ONE_DAY,
} from '@/lib/constants';
import { defaultCourseSetting, readCourseSetting } from '@/lib/course';
import { pushToWebViewNormal } from '@/lib/webview';
import { fetchWithCache } from '@/utils/fetch-with-cache';

export default function PersonalInfoListPage() {
  const [settings, setSettings] = useState<CourseSetting>(defaultCourseSetting);

  // 从 AsyncStorage 的 COURSE_SETTINGS_KEY 中读取，是一个 json 数据
  const readSettingsFromStorage = useCallback(async () => {
    console.log('读取课程设置');
    setSettings(await readCourseSetting());
  }, []);

  // 将当前设置保存至 AsyncStorage，采用 json 形式保存
  const saveSettingsToStorage = useCallback(async (newSettings: CourseSetting) => {
    console.log('保存课程设置, ', newSettings);
    await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(newSettings));
  }, []);

  // 页面加载时读取设置
  useEffect(() => {
    readSettingsFromStorage();
  }, [readSettingsFromStorage]);

  // 设置变化时保存设置
  useUpdateEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings, saveSettingsToStorage]);

  const handleSubscribeChange = async () => {
    try {
      if (!settings.calendarExportEnabled) {
        // 如果用户开启了日历订阅，调用接口获取订阅地址，本地缓存 30 天。
        const resultData = await fetchWithCache(
          [CALENDAR_SUBSCRIPTION_TOKEN_KEY],
          () => getApiV1JwchCourseCalendarToken(),
          30 * EXPIRE_ONE_DAY,
        );

        console.log('获取到的订阅地址', resultData.data.data);
        toast.success('订阅地址获取成功');

        setSettings(prevSettings => ({
          ...prevSettings,
          calendarExportEnabled: true,
          calendarSubscribeUrl: CALENDAR_SUBSCRIPTION_PREFIX + resultData.data.data,
        }));
      } else {
        // 否则清空订阅地址并关闭订阅
        setSettings(prevSettings => ({
          ...prevSettings,
          calendarExportEnabled: false,
          calendarSubscribeUrl: '',
        }));
      }
    } catch (error) {
      console.error('订阅地址获取失败:', error);
    }
  };

  const copySubscribeUrl = () => {
    Clipboard.setString(settings.calendarSubscribeUrl);
    toast.success('订阅地址已复制');
  };

  return (
    <>
      <Stack.Screen options={{ title: '日历订阅' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            <Text className="mb-2 text-sm text-text-secondary">我们提供日历订阅功能，以支持系统级的课程日历管理。</Text>

            <LabelEntry
              leftText="使用教程"
              onPress={() => {
                pushToWebViewNormal('https://west2-online.feishu.cn/wiki/UJVYwYQ7YilgNakD4z9cYtYZnvh');
              }}
            />
            <LabelSwitch
              label="启用日历订阅"
              value={settings.calendarExportEnabled}
              onValueChange={handleSubscribeChange}
            />
            {settings.calendarExportEnabled && (
              <View>
                <Text className="my-2 text-sm text-text-secondary">订阅地址（点击可复制）</Text>
                <Text onPress={copySubscribeUrl} className="break-words bg-transparent text-sm text-text-primary">
                  {settings.calendarSubscribeUrl}
                </Text>
              </View>
            )}

            <View className="space-y-4">
              <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
              <Text className="my-2 text-base text-text-secondary">
                注意：订阅链接切忌随意发送给他人或传播到互联网上！拥有订阅链接的人可以直接看到您的课程信息，请确保只在您的个人设备上使用订阅，以免造成数据泄露。
              </Text>
              <Text className="my-2 text-base text-text-secondary">
                1. 日历订阅不会自动同步教务处课程变动。如果您的课程发生变动，只需要重新打开 App
                进入「课表设置」点击「刷新数据」即可，不需要更换订阅链接。
              </Text>
              <Text className="my-2 text-base text-text-secondary">
                2. 订阅只支持订阅最新学期（即当前学期）的课表数据。
              </Text>
              <Text className="my-2 text-base text-text-secondary">
                3. App
                默认只提供基础的日历订阅支持。如果您需要更多个性化的功能，可以参考服务端代码（我的-关于-项目源代码）来自行实现相关逻辑。
              </Text>
            </View>
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
