import { Tabs, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

import { HeaderIcon } from '@/components/HeaderIcon';
import { TabBarIcon } from '@/components/TabBarIcon';
import { Text, View } from 'react-native';

const NAVIGATION_TITLE = '主页';

export default function TabLayout() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: '课程',
          headerTitleAlign: 'center',
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
