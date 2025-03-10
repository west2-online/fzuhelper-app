import { Link, Stack } from 'expo-router';

import { Icon } from '@/components/Icon';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen name="哎呀，页面不见啦！" />

      {/* 页面内容 */}
      <PageContainer className="items-center justify-center p-5">
        {/* 可爱表情图标 */}
        <Icon name="sad-outline" size={80} color="#FF6F61" />

        {/* 提示文字 */}
        <Text className="mt-6 text-center text-xl font-semibold">哎呀，这个页面被小猫叼走啦！</Text>
        <Text className="mt-2 text-center text-base text-text-secondary">不用担心，你可以回到首页重新找路~</Text>

        {/* 返回首页按钮 */}
        <Link href="/" asChild replace>
          <Button className="mt-8" size="lg">
            <Text className="text-lg">回到首页</Text>
          </Button>
        </Link>
      </PageContainer>
    </>
  );
}
