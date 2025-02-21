import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  NotificationSettings,
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  checkNotifications,
  openSettings,
} from 'react-native-permissions';

import LabelEntry from '@/components/LabelEntry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScrollView } from 'react-native-gesture-handler';
import { toast } from 'sonner-native';

export default function AcademicPage() {
  const [isAllowNotification, setAllowNotification] = useState(false); // 通知权限
  const [isAllowCalendar, setAllowCalendar] = useState(false); // 日历权限
  const [isAllowCamera, setAllowCamera] = useState(false); // 相机权限
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(); // 目前允许的通知内容

  // 在页面加载时检测权限
  useEffect(() => {
    if (Platform.OS === 'android') {
    } else if (Platform.OS === 'ios') {
      checkMultiple([PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.CALENDARS]).then(statues => {
        setAllowCamera(statues[PERMISSIONS.IOS.CAMERA] === RESULTS.GRANTED); // 相机权限
        setAllowCalendar(statues[PERMISSIONS.IOS.CALENDARS] === RESULTS.GRANTED); // 日历权限
      });

      checkNotifications().then(({ status, settings }) => {
        setAllowNotification(status === RESULTS.GRANTED); // 通知权限
        setNotificationSettings(settings);
        console.log('目前允许的通知内容', settings);
      });
    }
  }, []);

  const handleNotificationPermission = () => {
    if (Platform.OS === 'ios') {
      openSettings('notifications').catch(() => {
        toast.error('程序无法打开设置页面，请手动打开');
      });
    }
  };

  const handleCalendarPermission = () => {
    if (Platform.OS === 'ios') {
      openSettings('application').catch(() => {
        toast.error('程序无法打开设置页面，请手动打开');
      });
    }
  };

  const handleCameraPermission = () => {
    if (Platform.OS === 'ios') {
      openSettings('application').catch(() => {
        toast.error('程序无法打开设置页面，请手动打开');
      });
    }
  };
  return (
    <>
      <Stack.Screen options={{ title: '权限设置' }} />

      <PageContainer>
        <ScrollView className="flex-1 bg-background px-8 pt-8">
          <SafeAreaView edges={['bottom']}>
            {/* 菜单列表 */}
            <Text className="mb-2 text-sm text-foreground">
              为了提供更好的服务，我们在特定场景下需要向您申请系统权限。在本页面，您也可以了解到我们会如何使用这些权限。
            </Text>

            <LabelEntry
              leftText="通知 (Notification)"
              onPress={handleNotificationPermission}
              description="用于推送考场安排、课程成绩、教务处通知等学校侧通知。APP 受福州大学监管，不会推送广告消息"
              rightText={isAllowNotification ? '已开启' : '未开启'}
            />
            <LabelEntry
              leftText="日历 (Calendar)"
              onPress={handleCalendarPermission}
              description="用于导出课表、考场安排等内容到日历"
              rightText={isAllowCalendar ? '已开启' : '未开启'}
            />
            <LabelEntry
              leftText="相机 (Camera)"
              onPress={handleCameraPermission}
              description="用于自定义壁纸时直接进行拍照"
              rightText={isAllowCamera ? '已开启' : '未开启'}
            />
          </SafeAreaView>
        </ScrollView>
      </PageContainer>
    </>
  );
}
