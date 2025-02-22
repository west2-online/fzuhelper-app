import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import {
  NotificationSettings,
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  checkNotifications,
  openSettings,
} from 'react-native-permissions';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';

import ExpoUmengModule from '@/modules/umeng-bridge';
import { ScrollView } from 'react-native-gesture-handler';
import { toast } from 'sonner-native';

export default function AcademicPage() {
  const [isAllowNotification, setAllowNotification] = useState(false); // 通知权限
  const [isAllowCalendar, setAllowCalendar] = useState(false); // 日历权限
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(); // 目前允许的通知内容
  const appState = useRef(AppState.currentState);

  const checkPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      setAllowNotification(ExpoUmengModule.hasPermission()); // 通知权限
      checkMultiple([PERMISSIONS.ANDROID.READ_CALENDAR, PERMISSIONS.ANDROID.WRITE_CALENDAR]).then(statues => {
        setAllowCalendar(
          statues[PERMISSIONS.ANDROID.READ_CALENDAR] === RESULTS.GRANTED &&
            statues[PERMISSIONS.ANDROID.WRITE_CALENDAR] === RESULTS.GRANTED,
        ); // 日历权限
      });
    } else if (Platform.OS === 'ios') {
      checkMultiple([PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.CALENDARS]).then(statues => {
        setAllowCalendar(statues[PERMISSIONS.IOS.CALENDARS] === RESULTS.GRANTED); // 日历权限
      });

      checkNotifications().then(({ status, settings }) => {
        setAllowNotification(status === RESULTS.GRANTED); // 通知权限
        setNotificationSettings(settings);
        console.log('目前允许的通知内容', settings);
      });
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkPermission();
      }
      appState.current = nextAppState;
    });

    checkPermission();

    return () => {
      subscription.remove();
    };
  });

  const handleNotificationPermission = () => {
    openSettings('notifications').catch(() => {
      toast.error('程序无法打开设置页面，请手动打开');
    });
  };

  const handleCalendarPermission = () => {
    openSettings('application').catch(() => {
      toast.error('程序无法打开设置页面，请手动打开');
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: '隐私权限设置' }} />

      <PageContainer>
        <ScrollView className="flex-1 bg-background px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            {/* 菜单列表 */}
            <Text className="mb-2 text-sm text-text-secondary">
              为了提供更好的服务，我们在特定场景下需要向您申请系统权限。在本页面，您也可以了解到我们会如何使用这些权限。
            </Text>

            <LabelEntry
              leftText="通知权限"
              onPress={handleNotificationPermission}
              description="用于推送成绩更新、教务处通知等内容"
              rightText={isAllowNotification ? '已开启' : '未开启'}
            />
            <LabelEntry
              leftText="日历权限"
              onPress={handleCalendarPermission}
              description="用于导出课表、考场安排等内容到日历"
              rightText={isAllowCalendar ? '已开启' : '未开启'}
            />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
