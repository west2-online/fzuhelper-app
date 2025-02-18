import { ThemedView } from '@/components/ThemedView';
import { Stack } from 'expo-router';

export default function FilePreviewPage() {


  return (
    <>
      <Stack.Screen options={{ title: '已下载' }} />
      <ThemedView className="flex-1">
      </ThemedView>
    </>
  );
}
