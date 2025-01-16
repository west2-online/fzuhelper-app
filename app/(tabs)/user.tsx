import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Link } from 'expo-router';

export default function HomePage() {
  return (
    <>
      <ThemedView>
        <Link href="/devtools/devtools" asChild>
          <Button>
            <Text>开发者选项</Text>
          </Button>
        </Link>
      </ThemedView>
    </>
  );
}
