import { ThemedView } from '@/components/ThemedView';
import { Stack, UnknownOutputParams, useLocalSearchParams } from 'expo-router';

interface FilePreviewPageParam extends UnknownOutputParams {
  filepath: string;
}

export default function FilePreviewPage() {
  const { filepath } = useLocalSearchParams<FilePreviewPageParam>();
  const filename = filepath.substring(filepath.lastIndexOf('/') + 1);

  return (
    <>
      <Stack.Screen options={{ title: filename }} />
      <ThemedView className="flex-1">
      </ThemedView>
    </>
  );
}
