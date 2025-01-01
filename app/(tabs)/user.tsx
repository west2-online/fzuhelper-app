import { Link } from 'expo-router';
import { Button, Text } from 'react-native';

import { ThemedView } from '@/components/ThemedView';

export default function HomePage() {
  return (
    <>
      <ThemedView>
        <Text>User</Text>
        <Text>111</Text>
        <Link href="/login" asChild>
          <Button title="Login" />
        </Link>
      </ThemedView>
    </>
  );
}
