import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { colorScheme } from 'nativewind';
import { useColorScheme } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Toaster } from 'sonner-native';

import { Provider } from '@/components/Provider';
import { cn } from '@/lib/utils';
import '../global.css';

colorScheme.set('system');

// 这个页面作为根页面，我们不会过多放置逻辑，到 app 的逻辑可以查看 (tabs)/_layout.tsx
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <KeyboardProvider>
          <GestureHandlerRootView>
            <Stack>
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
  );
}
