import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { colorScheme } from 'nativewind';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import { QueryProvider } from '@/components/query-provider';
import aegis from '@/lib/aegis';
import { JWCH_USER_ID_KEY } from '@/lib/constants';
import { cn } from '@/lib/utils';

import '../global.css';

// 此处配置 NativeWind 的颜色方案
colorScheme.set('system');

// 这个页面作为根页面，我们不会过多放置逻辑，到 app 的逻辑可以查看 (tabs)/_layout.tsx
export default function RootLayout() {
  const currentColorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      aegis.setConfig({
        uin: await AsyncStorage.getItem(JWCH_USER_ID_KEY),
      });
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        {/* 此处配置 Expo Router 封装的 React Navigation 系列组件的浅色/深色主题 */}
        <ThemeProvider value={currentColorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <KeyboardProvider>
            <GestureHandlerRootView>
              <Stack screenOptions={{ animation: 'ios_from_right' }}>
                <Stack.Screen name="/(guest)" />
                <Stack.Screen name="+not-found" />
              </Stack>

              <Toaster cn={cn} position="top-center" duration={2500} offset={100} />
              <PortalHost />
              <SystemBars style="auto" />
            </GestureHandlerRootView>
          </KeyboardProvider>
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
