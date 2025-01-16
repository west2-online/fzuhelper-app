import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Link, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

const NAVIGATION_TITLE = '开发者选项';

export default function HomePage() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  return (
    <>
      <ThemedView>
        <Link href="/login" asChild>
          <Button>
            <Text>Push Login Page</Text>
          </Button>
        </Link>
        <Link href="/devtools/asyncStorageList" asChild>
          <Button>
            <Text>AsyncStorage List</Text>
          </Button>
        </Link>
      </ThemedView>
    </>
  );
}
