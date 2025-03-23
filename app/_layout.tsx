import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import { DownloadProgress } from '@/components/download-progress';
import { QueryProvider } from '@/components/query-provider';

import { getColorScheme } from '@/lib/appearance';
import { StackNavigatorScreenOptions } from '@/lib/constants';
import { cn } from '@/lib/utils';
import patchTextComponent from '@/utils/patch-text-component';
import patchTextRender from '@/utils/patch-text-render';

import '../global.css';

// 这个页面作为根页面，我们不会过多放置逻辑，到 app 的逻辑可以查看 (tabs)/_layout.tsx
export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    (async () => {
      const storedTheme = await getColorScheme();
      // 此处配置 NativeWind 的颜色方案
      // console.log('storedTheme', storedTheme);
      setColorScheme(storedTheme);
    })();
  }, [setColorScheme]);

  useEffect(() => {
    // https://github.com/facebook/react-native/issues/15114#issuecomment-2422537975
    try {
      patchTextComponent();
      patchTextRender();
    } catch (e) {
      console.error('Failed to patch text component', e);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        {/* 此处配置 Expo Router 封装的 React Navigation 系列组件的浅色/深色主题 */}
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <KeyboardProvider>
            <GestureHandlerRootView>
              <Stack screenOptions={StackNavigatorScreenOptions}>
                <Stack.Screen name="/(guest)" />
                <Stack.Screen name="+not-found" />
              </Stack>

              <Toaster cn={cn} position="top-center" duration={2500} offset={100} />
              <PortalHost />
              <SystemBars style="auto" />
              <DownloadProgress />
            </GestureHandlerRootView>
          </KeyboardProvider>
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
