import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import LabelSwitch from '@/components/label-switch';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALLOW_PUSH_EVENT_KEYS } from '@/lib/constants';
import { NotificationsSettings } from '@/types/notifications';
import { ScrollView } from 'react-native-gesture-handler';
import { toast } from 'sonner-native';

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

  const updateSetting = (key: keyof NotificationsSettings, value: boolean) => {
    setSettings(prev => {
      const updatedSettings = {
        ...prev,
        [key]: value,
      };
      saveSettingsToStorage(updatedSettings);
      return updatedSettings;
    });
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

  const handleTeachingNotice = () => {
    const newValue = !settings.allowJWCHTeachingNotice;
    updateSetting('allowJWCHTeachingNotice', newValue);
    toast('已 ' + (newValue ? '开启' : '关闭') + ' 教学通知');
  };

  const hanleMarkNotice = () => {
    const newValue = !settings.allowGradeUpdateNotice;
    updateSetting('allowGradeUpdateNotice', newValue);
    toast('已 ' + (newValue ? '开启' : '关闭') + ' 成绩通知');
  };

  const handleExamNotice = () => {
    const newValue = !settings.allowExamNotice;
    updateSetting('allowExamNotice', newValue);
    toast('已 ' + (newValue ? '开启' : '关闭') + ' 考试通知');
  };

  return (
    <>
      <Stack.Screen options={{ title: '推送管理' }} />

      <PageContainer>
        <ScrollView className="flex-1 px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            <Text className="mb-2 text-sm text-text-secondary">通用</Text>

            <LabelSwitch
              label="教学通知"
              value={settings.allowJWCHTeachingNotice}
              onValueChange={handleTeachingNotice}
              description="由教务处发布，含停调课、教学安排、竞赛通知等"
            />

            <Text className="my-2 text-sm text-text-secondary">学业</Text>

            <LabelSwitch
              label="考试成绩通知"
              value={settings.allowGradeUpdateNotice}
              onValueChange={hanleMarkNotice}
              description="首次更新课程成绩时通知(不具备实时性，通常在成绩发布后的24小时内)"
            />

            <LabelSwitch
              label="考试通知"
              value={settings.allowExamNotice}
              onValueChange={handleExamNotice}
              description="教师发布考试安排时通知(不具备实时性，通常在考场更新后的24小时内)"
            />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
