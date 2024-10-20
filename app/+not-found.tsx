import { Link, Stack } from 'expo-router';
import { Text } from 'react-native';

import { ThemedView } from '@/components/ThemedView';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView className="flex items-center justify-center p-5">
        <Text>This screen doesn't exist.</Text>
        <Link href="/" className="mt-4 py-4">
          Go to home screen!
        </Link>
      </ThemedView>
    </>
  );
}
