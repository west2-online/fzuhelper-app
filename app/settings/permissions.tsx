import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import {
  NotificationSettings,
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  checkNotifications,
  openSettings,
  request,
  requestNotifications,
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

  const openNotificationSettings = () => {
    openSettings('notifications').catch(() => {
      toast.error('程序无法打开设置页面，请手动打开');
    });
  };

  const openApplicationSettings = () => {
    openSettings('application').catch(() => {
      toast.error('程序无法打开设置页面，请手动打开');
    });
  };

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
      await checkMultiple([PERMISSIONS.IOS.CALENDARS]).then(statues => {
        setAllowCalendar(statues[PERMISSIONS.IOS.CALENDARS] === RESULTS.GRANTED); // 日历权限
      });

      await checkNotifications().then(({ status, settings }) => {
        setAllowNotification(status === RESULTS.GRANTED); // 通知权限
        setNotificationSettings(settings);
      });
    }
  }, []);

  useEffect(() => {
    // 监听应用状态变化
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
  }, []); // 放空使得只加载一次

  const handleNotificationPermission = () => {
    if (Platform.OS === 'android') {
      openNotificationSettings();
    } else if (Platform.OS === 'ios') {
      if (isAllowCalendar) {
        openNotificationSettings();
        return;
      }
      requestNotifications(['alert', 'badge', 'sound']).then(({ status, settings }) => {
        console.log('通知权限: ', status);
        console.log('目前允许的通知内容', settings);
        switch (status) {
          case RESULTS.DENIED:
            toast.error('您已拒绝了通知权限');
            break;
          case RESULTS.UNAVAILABLE:
            toast.error('当前设备不支持通知权限');
            break;
          case RESULTS.BLOCKED:
            Alert.alert(
              '提示',
              '通知权限被手动关闭，需要您手动打开。点击确认跳转设置页',
              [
                {
                  text: '取消',
                  style: 'cancel', // iOS 上会显示为取消按钮样式
                },
                {
                  text: '去设置',
                  onPress: openNotificationSettings,
                },
              ],
              { cancelable: true },
            );
            break;
          case RESULTS.GRANTED:
            setAllowNotification(true);
            break;
        }
      });
    }
  };

  const handleCalendarPermission = () => {
    if (Platform.OS === 'ios') {
      if (isAllowNotification) {
        openApplicationSettings();
        return;
      }
      request(PERMISSIONS.IOS.CALENDARS).then(result => {
        switch (result) {
          case RESULTS.DENIED:
            toast.error('您已拒绝了日历权限');
            break;
          case RESULTS.UNAVAILABLE:
            toast.error('当前设备不支持日历权限');
            break;
          case RESULTS.BLOCKED:
            Alert.alert(
              '提示',
              '日历权限被手动关闭，需要您手动打开。点击确认跳转设置页',
              [
                {
                  text: '取消',
                  style: 'cancel', // iOS 上会显示为取消按钮样式
                },
                {
                  text: '去设置',
                  onPress: openApplicationSettings,
                },
              ],
              { cancelable: true },
            );
            break;
          case RESULTS.GRANTED:
            setAllowCalendar(true);
            break;
        }
      });
    } else if (Platform.OS === 'android') {
      openApplicationSettings();
    }
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
              leftText="日历权限"
              onPress={handleCalendarPermission}
              description="用于导出课表、考场安排等内容到日历"
              rightText={isAllowCalendar ? '已开启' : '未开启'}
            />

            <LabelEntry
              leftText="通知权限"
              onPress={handleNotificationPermission}
              description="用于推送成绩更新、教务处通知等内容"
              rightText={isAllowNotification ? '已开启' : '未开启'}
            />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
