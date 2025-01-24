import { Tabs, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect } from 'react';

import { getApiV1JwchPing } from '@/api/generate';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { Alert } from 'react-native';

const NAVIGATION_TITLE = '主页';

export default function TabLayout() {
  const { handleError } = useSafeResponseSolve();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  // 检查登录状态
  const checkLoginStatus = useCallback(async () => {
    try {
      await getApiV1JwchPing(); // 检查当前 App 和服务端的连接状态
      // 此处只会检查 Token 是否有效，不会检查账号是否过期
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        Alert.alert('请求失败', data.code + ': ' + data.message);
      }
      // 如果出现异常，例如网络错误或超时，会在 hooks/useSafeResponseSolve.ts 中处理
      // 这里不必做额外的处理
    }
  }, [handleError]);

  // 使用 useFocusEffect 在组件获得焦点时检查登录状态
  useFocusEffect(
    useCallback(() => {
      checkLoginStatus();
    }, [checkLoginStatus]),
  );

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: '主页',
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: '工具箱',
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? 'albums' : 'albums-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="qrcode"
        options={{
          title: '一码通',
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? 'albums' : 'albums-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: '我的',
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />,
        }}
      />
    </Tabs>
  );
}
