import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import LabelSwitch from '@/components/label-switch';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALLOW_PUSH_EVENT_KEYS } from '@/lib/constants';
import { NotificationManager } from '@/lib/notification';
import ExpoUmengModule from '@/modules/umeng-bridge';
import { NotificationsSettings } from '@/types/notifications';
import { ScrollView } from 'react-native-gesture-handler';

const defaultNotificationsSetting: NotificationsSettings = {
  allowJWCHTeachingNotice: false,
  allowGradeUpdateNotice: false,
  allowExamNotice: false,
};

export default function PushSettingsPage() {
  const [settings, setSettings] = useState<NotificationsSettings>(defaultNotificationsSetting);

  const saveSettingsToStorage = async (newSettings: NotificationsSettings) => {
    await AsyncStorage.setItem(ALLOW_PUSH_EVENT_KEYS, JSON.stringify(newSettings));
  };

  const updateSetting = async (key: keyof NotificationsSettings, value: boolean) => {
    const updatedSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(updatedSettings);
    await saveSettingsToStorage(updatedSettings);
    NotificationManager.register(); // 初始化通知
  };

  useEffect(() => {
    const readSettingsFromStorage = async () => {
      const data = await AsyncStorage.getItem(ALLOW_PUSH_EVENT_KEYS);
      if (data) {
        setSettings(JSON.parse(data));
      }
    };

    readSettingsFromStorage();
  }, []);

  const checkPermission = () => {
    if (!ExpoUmengModule.hasPermission()) {
      ExpoUmengModule.requirePermission();
    }
  };

  const handleTeachingNotice = () => {
    checkPermission();
    const newValue = !settings.allowJWCHTeachingNotice;
    updateSetting('allowJWCHTeachingNotice', newValue);
  };

  const hanleMarkNotice = () => {
    checkPermission();
    const newValue = !settings.allowGradeUpdateNotice;
    updateSetting('allowGradeUpdateNotice', newValue);
  };

  const handleExamNotice = () => {
    checkPermission();
    const newValue = !settings.allowExamNotice;
    updateSetting('allowExamNotice', newValue);
  };

  return (
    <>
      <Stack.Screen options={{ title: '通知推送' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            <Text className="mb-2 text-sm text-text-secondary">通用</Text>

            <LabelSwitch
              label="教务通知"
              value={settings.allowJWCHTeachingNotice}
              onValueChange={handleTeachingNotice}
              description="由教务处发布，含调停课、教学安排、竞赛通知等"
            />

            <Text className="my-2 text-sm text-text-secondary">学业</Text>

            <LabelSwitch
              label="考试成绩通知"
              value={settings.allowGradeUpdateNotice}
              onValueChange={hanleMarkNotice}
              description="课程成绩有更新时通知（通常在成绩发布后24小时内推送）"
            />

            <LabelSwitch
              label="考试通知"
              value={settings.allowExamNotice}
              onValueChange={handleExamNotice}
              description="教师发布考试安排时通知（通常在考场更新后24小时内推送）"
            />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
