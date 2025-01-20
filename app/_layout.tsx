import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';

import { Provider } from '@/components/Provider';
import { cn } from '@/lib/utils';

import '../global.css';

export default function RootLayout() {
  return (
    <Provider>
      <GestureHandlerRootView>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>

        <Toaster cn={cn} position="bottom-center" swipeToDismissDirection="left" closeButton />
        <PortalHost />
      </GestureHandlerRootView>
    </Provider>
  );
}
