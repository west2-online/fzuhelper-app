import { Stack } from 'expo-router';
import { H1, View } from 'tamagui';

import { LinkButton } from '@/components/Link';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap="$6"
        minHeight="100vh"
      >
        <H1>页面不存在</H1>

        <LinkButton href="/" variant="outlined">
          返回首页
        </LinkButton>
      </View>
    </>
  );
}
