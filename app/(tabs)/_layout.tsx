import { Tabs } from 'expo-router';

import { HeaderIcon } from '@/components/HeaderIcon';
import { TabBarIcon } from '@/components/TabBarIcon';
import { Text, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: '课程',
          headerTitleAlign: 'center',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerLeft: props => (
            <View className="px-4">
              <Text>第 X 周</Text>
            </View>
          ),
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: props => (
            <View className="px-4">
              <HeaderIcon name="settings-outline" />
            </View>
          ),
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
