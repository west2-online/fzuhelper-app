import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { ThemedView } from '@/components/ThemedView';

export default function HomePage() {
  return (
    <>
      <ThemedView>
        <Text>User</Text>
        <Text>111</Text>
        <Link href="/login" asChild>
          <Button>
            <Text>登录</Text>
          </Button>
        </Link>
      </ThemedView>
    </>
  );
}
