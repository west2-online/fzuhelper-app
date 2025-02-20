import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import { Provider } from '@/components/Provider';
import { cn } from '@/lib/utils';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import '../global.css';

// 这个页面作为根页面，我们不会过多放置逻辑，到 app 的逻辑可以查看 (tabs)/_layout.tsx
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider>
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
      </Provider>
    </SafeAreaProvider>
  );
}
