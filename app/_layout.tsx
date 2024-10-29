import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { TamaguiProvider } from 'tamagui';

import tamaguiConfig from '../tamagui.config';

if (Platform.OS === 'web') {
  require('@tamagui/core/reset.css');
  require('../tamagui-web.css');
}

export default function RootLayout() {
  return (
    <TamaguiProvider config={tamaguiConfig}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </TamaguiProvider>
  );
}
