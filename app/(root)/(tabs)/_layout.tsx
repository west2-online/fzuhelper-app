import { Tabs, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';

const NAVIGATION_TITLE = '主页';

export default function TabLayout() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE, headerShown: false });

    return () => {
      navigation.setOptions({ headerShown: true });
    };
  }, [navigation]);

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: '主页',
          href: '/',
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="toolbox"
        options={{
          title: '工具箱',
          href: '/toolbox',
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? 'albums' : 'albums-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="qrcode"
        options={{
          title: '一码通',
          href: '/qrcode',
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'qr-code' : 'qr-code-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: '我的',
          href: '/user',
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />,
        }}
      />
    </Tabs>
  );
}
