import { BlurView } from 'expo-blur';
import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting, type RouterAction } from 'expo-quick-actions/router';
import { Stack, Tabs, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Alert, AppState, Platform, StyleSheet, View } from 'react-native';

import { TabBarIcon } from '@/components/TabBarIcon';

import { getApiV1JwchPing } from '@/api/generate';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { checkAndroidUpdate, showAndroidUpdateDialog } from '@/utils/android-update';
import * as FileCache from '@/utils/file-cache';

const NAVIGATION_TITLE = '首页';

// 进入这个 Layout，我们视为进入 app 主页面，因此会设置一些额外逻辑，比如关于 app 状态的一些信息
export default function TabLayout() {
  useQuickActionRouting();

  const navigation = useNavigation();
  const appState = useRef(AppState.currentState);
  const { handleError } = useSafeResponseSolve();
  useLayoutEffect(() => {
    // 设置标题栏为不可见，但必须设置标题，否则当你进入其他页面时，返回 button 只能显示文件夹
    navigation.setOptions({ title: NAVIGATION_TITLE, headerShown: false });

    // 下面这个 return 语句是用来在组件销毁时恢复标题栏的
    return () => {
      navigation.setOptions({ headerShown: true });
    };
  }, [navigation]);

  // 携带本地 token 去请求服务器，检查 token 活跃状态
  // 这个 token 和用户的 cookie 是两个不同的东西，token 的作用是我们服务端用于验证合法请求的
  // 而 cookie 则是我们用于携带访问教务处的身份信息
  const pingToServre = useCallback(async () => {
    try {
      await getApiV1JwchPing(); // 这里是一个 ping 接口，用来测试服务器是否正常
    } catch (error: any) {
      const data = handleError(error) as { code: string; message: string };
      if (data) {
        Alert.alert('服务器连接失败', data.message);
      }
      // 如果出现异常，例如网络错误或超时，会在 hooks/useSafeResponseSolve.ts 中处理
      // 这里不必做额外的处理
    }
  }, [handleError]);

  // 设置 app 状态监听
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        pingToServre();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  });

  useEffect(() => {
    // 安卓检查更新
    if (Platform.OS === 'android') {
      checkAndroidUpdate(handleError, {
        onUpdate: data => {
          showAndroidUpdateDialog(data);
        },
      });
    }
  }, [handleError]);

  // 设置快捷操作（Android，iOS 需要同步配置config，详见 @/app.config.ts ）
  useEffect(() => {
    QuickActions.setItems<RouterAction>([
      {
        id: '1',
        title: '一码通',
        params: { href: '/qrcode' },
        icon: 'qrcode',
      },
    ]);
  }, []);

  // 应用启动时触发一次过期缓存清理
  useEffect(() => {
    try {
      FileCache.cleanupExpired()
        .then(r => {
          if (r && (r as any).deleted) console.log('Initial cache cleanup deleted', (r as any).deleted, 'files');
        })
        .catch(e => {
          console.warn('Initial cache cleanup failed', e);
        });
    } catch (e) {
      console.warn('Initial cache cleanup schedule failed', e);
    }
  }, []);
  // 以下代码用于监听 Universal Link，但是注意到 Expo 已经帮忙处理了，目前暂时不启用
  // 但是 Expo-Router 的跳转只能处理已有 URL，我们如果需要更丰富的跳转逻辑，仍然需要借助下面的代码，因此暂时保留
  // useEffect(() => {
  //   const handleUrl = (event: { url: string }) => {
  //     const url = event.url;
  //     console.log('Received URL:', url);
  //     // 用于处理 Universal Link，目前使用到的场景是一码通的跳转，其他的没有使用
  //     // 一码通的 URL会包含 west2.online/qrcode，因此我们可以根据这个来判断是否是一码通的跳转
  //     if (url.includes('west2.online/open-qrcode')) {
  //       router.push('/qrcode');
  //     }
  //   };
  //   Linking.getInitialURL()
  //     .then(url => {
  //       if (url) {
  //         handleUrl({ url });
  //       }
  //     })
  //     .catch(err => console.error('Error getting initial URL:', err));

  //   const subscription = Linking.addEventListener('url', handleUrl);

  //   // 结束时卸载监听器
  //   return () => {
  //     subscription.remove();
  //   };
  // });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Tabs
        screenOptions={{
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerTransparent: true,
          tabBarPosition: 'bottom',
          tabBarStyle: { position: 'absolute', elevation: 0 },
          // eslint-disable-next-line react/no-unstable-nested-components
          tabBarBackground: () =>
            Platform.OS === 'ios' ? (
              <BlurView
                intensity={50}
                tint="light"
                // eslint-disable-next-line react-native/no-inline-styles
                style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', overflow: 'hidden' }}
              />
            ) : (
              // TODO: 目前是使用了 BlurView 来实现毛玻璃效果，但是这个组件在 Android 上会有问题，因此暂时不使用
              <View className={'flex-1 bg-background/10'} />
            ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '课程',
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
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'albums' : 'albums-outline'} color={color} />
            ),
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
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
