import { Link, Stack } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import PageContainer from '@/components/page-container';
import { Card } from '@/components/ui/card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnekeyCommentHintPage() {
  const { bottom } = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen
        options={{
          title: '一键评议',
        }}
      />

      <PageContainer>
        <Card className="flex h-full justify-center rounded-tr-4xl px-10" style={{ paddingBottom: bottom }}>
          <Text className="py-2 text-lg font-bold text-text-primary">请先阅读：</Text>
          <Text className="mb-32 text-base leading-10 tracking-wider text-text-secondary">
            给每个老师评议的时候，都需亲自输入评分和评语。若没有输入评语，则系统自动匹配评语。
            {'\n'}
            功能试运行，若有问题，可关闭重新开启 APP，亦可通过我的-帮助与反馈加群进行反馈。
          </Text>
          <Link href="/toolbox/onekey-comment/form" asChild>
            <Button>
              <Text>确认</Text>
            </Button>
          </Link>
        </Card>
      </PageContainer>
    </>
  );
}
