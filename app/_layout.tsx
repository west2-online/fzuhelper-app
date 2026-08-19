import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { Stack as HarmonyStack } from 'expo-router/js-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import { AppThemeProvider } from '@/components/app-theme-provider';
import { DownloadProgress } from '@/components/download-progress';
import { QueryProvider } from '@/components/query-provider';

import { LearningCenterContextProvider } from '@/context/learning-center';
import { HARMONY_HEADER_RIGHT_CONTAINER_STYLE, StackNavigatorScreenOptions } from '@/lib/constants';
import patchTextComponent from '@/utils/patch-text-component';

import '../global.css';

// 这个页面作为根页面，我们不会过多放置逻辑，到 app 的逻辑可以查看 (tabs)/_layout.tsx
export default function RootLayout() {
  const isHarmony = (Platform.OS as string) === 'harmony';

  useEffect(() => {
    // https://github.com/facebook/react-native/issues/15114#issuecomment-2422537975
    try {
      patchTextComponent();
    } catch (e) {
      console.error('Failed to patch text component', e);
    }
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <QueryProvider>
        <AppThemeProvider>
          <KeyboardProvider>
            <GestureHandlerRootView style={styles.root}>
              <LearningCenterContextProvider>
                {isHarmony ? (
                  // Keep headers and navigation history without using the
                  // Harmony native ScreenStack that drops page content.
                  <HarmonyStack screenOptions={harmonyStackScreenOptions}>
                    <HarmonyStack.Screen name="+not-found" />
                    <HarmonyStack.Screen
                      name="toolbox/learning-center/qr-scanner"
                      options={{ presentation: 'modal', title: '扫码' }}
                    />
                  </HarmonyStack>
                ) : (
                  <Stack screenOptions={StackNavigatorScreenOptions}>
                    <Stack.Screen name="+not-found" />
                    <Stack.Screen
                      name="toolbox/learning-center/qr-scanner"
                      options={{ presentation: 'modal', title: '扫码' }}
                    />
                  </Stack>
                )}

                <Toaster position="top-center" duration={2500} offset={100} style={toastStyle} />
                <PortalHost />
                <StatusBar />
                <DownloadProgress />
              </LearningCenterContextProvider>
            </GestureHandlerRootView>
          </KeyboardProvider>
        </AppThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

const toastStyle = {
  // For better toast background on android
  // Overrides https://github.com/gunnartorfis/sonner-native/blob/9656057710310528e05d98ae22d21520004cf8fa/src/toast.tsx#L504
  ...(Platform.OS === 'android' && { elevation: 20 }),
};

const harmonyStackScreenOptions = {
  ...StackNavigatorScreenOptions,
  animation: 'slide_from_right',
  headerRightContainerStyle: HARMONY_HEADER_RIGHT_CONTAINER_STYLE,
} as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
