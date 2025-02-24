import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
// @ts-expect-error Package `aegis-rn-sdk` did not have types definition.
import Aegis from 'aegis-rn-sdk';
import { Stack } from 'expo-router';
import { colorScheme } from 'nativewind';
import { Platform, useColorScheme } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import { Provider } from '@/components/Provider';

import { ResultEnum } from '@/api/enum';
import { cn } from '@/lib/utils';

import '../global.css';

// 此处配置 NativeWind 的颜色方案
colorScheme.set('system');

// 初始化腾讯云「前端性能监控」
const aegis = new Aegis({
  id: 'VD0m3Sd9r0180Pjd2W', // 上报 id
  // TODO: 在学号发生变化以后填充 uin 字段，等待 #42 合并后使用 useEffect + setConfig 方法动态设置，assigned to @renbaoshuo.
  // uin: '102401339', // 用户唯一 ID（可选）
  reportApiSpeed: true, // 开启接口测速
  hostUrl: 'https://rumt-zh.com',
  whiteListUrl: '', // 关闭白名单接口请求，减少金钱花销
  env: __DEV__ ? Aegis.environment.development : Aegis.environment.production,
  beforeRequest(data: any) {
    if (__DEV__) {
      console.log('aegis', data);
    }

    return data;
  },
  api: {
    retCodeHandler(_data: string) {
      try {
        const data = JSON.parse(_data);

        return {
          // isErr 如果是 true 的话，会上报一条 retcode 异常的日志。
          isErr: data.code !== ResultEnum.SuccessCode || data.code !== ResultEnum.SuccessCodePaper,
          code: data.code,
        };
      } catch {
        return {
          isErr: true,
          code: 0,
        };
      }
    },
  },
  ext1: `${Platform.OS} ${Platform.Version}`,
});

// 这个页面作为根页面，我们不会过多放置逻辑，到 app 的逻辑可以查看 (tabs)/_layout.tsx
export default function RootLayout() {
  const currentColorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <Provider>
        {/* 此处配置 Expo Router 封装的 React Navigation 系列组件的浅色/深色主题 */}
        <ThemeProvider value={currentColorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <KeyboardProvider>
            <GestureHandlerRootView>
              <Stack screenOptions={{ animation: 'slide_from_right' }}>
                <Stack.Screen name="/(guest)" />
                <Stack.Screen name="+not-found" />
              </Stack>

              <Toaster cn={cn} position="top-center" duration={2500} offset={100} />
              <PortalHost />
              <SystemBars style="auto" />
            </GestureHandlerRootView>
          </KeyboardProvider>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
