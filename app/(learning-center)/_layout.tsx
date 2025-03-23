import { Stack } from 'expo-router';

import { LearningCenterContextProvider } from '@/context/learning-center';
import { StackNavigatorScreenOptions } from '@/lib/constants';

export default function LearningCenterLayout() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <LearningCenterContextProvider>
        <Stack screenOptions={StackNavigatorScreenOptions} />
      </LearningCenterContextProvider>
    </>
  );
}
