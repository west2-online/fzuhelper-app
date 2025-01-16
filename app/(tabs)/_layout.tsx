import { getApiV1JwchPing } from '@/api/generate';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Tabs, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect } from 'react';

const NAVIGATION_TITLE = '主页';

export default function TabLayout() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  // 定义一个函数来检查登录状态
  const checkLoginStatus = async () => {
    console.log('Trigger Once');
    try {
      const result = await getApiV1JwchPing();
      console.log('请求成功:' + result.data.message);
    } catch (e) {
      console.log('遇到错误:' + JSON.stringify(e));
      console.log('遇到错误');
    }
  };

  // 使用 useFocusEffect 在组件获得焦点时检查登录状态
  useFocusEffect(
    useCallback(() => {
      checkLoginStatus();
    }, []),
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
