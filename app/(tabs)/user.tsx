import { Link } from 'expo-router';
import { Text } from 'react-native';

import Button from '@/components/Button';

import { ThemedView } from '@/components/ThemedView';

export default function HomePage() {
  return (
    <>
      <ThemedView>
        <Text>User</Text>
        <Text>111</Text>
        <Link href="/login" asChild>
          <Button>登录</Button>
        </Link>
      </ThemedView>
    </>
  );
}
