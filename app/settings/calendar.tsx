import Clipboard from '@react-native-clipboard/clipboard';
import { Stack } from 'expo-router';
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
import { CALENDAR_SUBSCRIPTION_PREFIX, CALENDAR_SUBSCRIPTION_TOKEN_KEY, EXPIRE_ONE_DAY } from '@/lib/constants';
import { defaultCourseSetting, getCourseSetting, updateCourseSetting } from '@/lib/course';
import { pushToWebViewNormal } from '@/lib/webview';
import { fetchWithCache } from '@/utils/fetch-with-cache';

export default function PersonalInfoListPage() {
  const [settings, setSettings] = useState<CourseSetting>(defaultCourseSetting);
  const [switchDisabled, setSwitchDisabled] = useState(false);

  const readSettingsFromStorage = useCallback(async () => {
    console.log('读取课程设置');
    setSettings(await getCourseSetting());
  }, []);

  // 页面加载时读取设置
  useEffect(() => {
    readSettingsFromStorage();
  }, [readSettingsFromStorage]);

  const handleSubscribeChange = useCallback(async () => {
    setSwitchDisabled(true);
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

        const newValue = {
          calendarExportEnabled: true,
          calendarSubscribeUrl: CALENDAR_SUBSCRIPTION_PREFIX + resultData.data.data,
        };
        setSettings(prevSettings => ({
          ...prevSettings,
          ...newValue,
        }));
        updateCourseSetting(newValue);
      } else {
        // 否则清空订阅地址并关闭订阅
        const newValue = {
          calendarExportEnabled: false,
          calendarSubscribeUrl: '',
        };
        setSettings(prevSettings => ({
          ...prevSettings,
          ...newValue,
        }));
        updateCourseSetting(newValue);
      }
    } catch (error) {
      console.error('订阅地址获取失败:', error);
    } finally {
      setSwitchDisabled(false);
    }
  }, [settings.calendarExportEnabled]);

  const copySubscribeUrl = useCallback(() => {
    Clipboard.setString(settings.calendarSubscribeUrl);
    toast.success('订阅地址已复制');
  }, [settings.calendarSubscribeUrl]);

  return (
    <>
      <Stack.Screen options={{ title: '日历订阅' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8" contentContainerClassName="pt-8">
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
              disabled={switchDisabled}
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
