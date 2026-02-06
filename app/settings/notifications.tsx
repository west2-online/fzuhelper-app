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
import { toast } from 'sonner-native';

const defaultNotificationsSetting: NotificationsSettings = {
  allowJWCHTeachingNotice: false,
  allowGradeUpdateNotice: false,
  allowExamNotice: false,
};

export default function PushSettingsPage() {
  const [settings, setSettings] = useState<NotificationsSettings>(defaultNotificationsSetting);
  const [loadingTeaching, setLoadingTeaching] = useState(false);
  const [loadingGrade, setLoadingGrade] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);

  const saveSettingsToStorage = async (newSettings: NotificationsSettings) => {
    await AsyncStorage.setItem(ALLOW_PUSH_EVENT_KEYS, JSON.stringify(newSettings));
  };

  const updateSetting = async (key: keyof NotificationsSettings, value: boolean) => {
    return new Promise<void>(resolve => {
      // 基于前一个状态更新，避免竞态条件
      setSettings(prevSettings => {
        const newSettings = {
          ...prevSettings,
          [key]: value,
        };
        // 异步保存和注册，完成后 resolve
        saveSettingsToStorage(newSettings)
          .then(() => NotificationManager.register())
          .then(() => resolve())
          .catch((error: any) => {
            toast.error('设置失败，请稍后重试：' + (error.data || error.message || '未知错误'));
            // 回滚 UI 和本地存储
            setSettings(prevSettings);
            saveSettingsToStorage(prevSettings);
            resolve(); // 即使失败也要 resolve，避免 loading 永久卡住
          });
        return newSettings;
      });
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

  const checkPermission = () => {
    if (!ExpoUmengModule.hasPermission()) {
      ExpoUmengModule.requirePermission();
    }
  };

  const handleTeachingNotice = async () => {
    setLoadingTeaching(true);
    try {
      checkPermission();
      const newValue = !settings.allowJWCHTeachingNotice;
      await updateSetting('allowJWCHTeachingNotice', newValue);
    } finally {
      setLoadingTeaching(false);
    }
  };

  const handleMarkNotice = async () => {
    setLoadingGrade(true);
    try {
      checkPermission();
      const newValue = !settings.allowGradeUpdateNotice;
      await updateSetting('allowGradeUpdateNotice', newValue);
    } finally {
      setLoadingGrade(false);
    }
  };

  const handleExamNotice = async () => {
    setLoadingExam(true);
    try {
      checkPermission();
      const newValue = !settings.allowExamNotice;
      await updateSetting('allowExamNotice', newValue);
    } finally {
      setLoadingExam(false);
    }
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
              loading={loadingTeaching}
            />

            <Text className="my-2 text-sm text-text-secondary">学业</Text>

            <LabelSwitch
              label="考试成绩通知"
              value={settings.allowGradeUpdateNotice}
              onValueChange={handleMarkNotice}
              description="课程成绩有更新时通知（通常在成绩发布后24小时内推送）"
              loading={loadingGrade}
            />

            <LabelSwitch
              label="考试通知"
              value={settings.allowExamNotice}
              onValueChange={handleExamNotice}
              description="教师发布考试安排时通知（通常在考场更新后24小时内推送）"
              loading={loadingExam}
            />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
