import { Slot, Stack, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

const NAVIGATION_TITLE = '主页';

export default function RootLayout() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Slot />
    </>
  );
}
