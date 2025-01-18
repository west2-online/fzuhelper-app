import { Link, Stack } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

const NAVIGATION_TITLE = '开发者选项';

export default function HomePage() {
  return (
    <>
      <Stack.Screen options={{ title: NAVIGATION_TITLE }} />

      <ThemedView>
        <Link href="/login" asChild>
          <Button>
            <Text>Push Login Page</Text>
          </Button>
        </Link>
        <Link href="/devtools/async-storage-list" asChild>
          <Button>
            <Text>AsyncStorage List</Text>
          </Button>
        </Link>
      </ThemedView>
    </>
  );
}
