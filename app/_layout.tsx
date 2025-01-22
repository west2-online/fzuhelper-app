import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';

import { Provider } from '@/components/Provider';
import { cn } from '@/lib/utils';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import '../global.css';

export default function RootLayout() {
  return (
    <Provider>
      <KeyboardProvider>
        <GestureHandlerRootView>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>

          <Toaster cn={cn} position="top-center" duration={2500} offset={100} />
          <PortalHost />
          <SystemBars style="auto" />
        </GestureHandlerRootView>
      </KeyboardProvider>
    </Provider>
  );
}
