import { LearningCenterContextProvider } from '@/context/learning-center';
import { Slot, Stack } from 'expo-router';

export default function LearningCenterLayout() {
  return (
    <>
      <Stack.Screen options={{ title: '学习中心' }} />

      <LearningCenterContextProvider>
        <Slot />
      </LearningCenterContextProvider>
    </>
  );
}
