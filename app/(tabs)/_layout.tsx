import { getApiV1JwchPing } from '@/api/generate';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { Tabs, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect } from 'react';

const NAVIGATION_TITLE = '主页';

export default function TabLayout() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  const { handleError } = useSafeResponseSolve();

  // 定义一个函数来检查登录状态
  const checkLoginStatus = async () => {
    console.log('Trigger Once');
    try {
      const result = await getApiV1JwchPing();
      console.log('请求成功:' + result.data.message);
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        console.log('业务错误', data);
      }
      // 我该如何在这里判断是属于异常及过期
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
