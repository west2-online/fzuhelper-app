import { Link, Tabs } from 'expo-router';
import { SafeAreaView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import PageContainer from '@/components/page-container';

export default function OnekeyCommentHintPage() {
  return (
    <>
      <Tabs.Screen
        options={{
          title: '一键评议',
        }}
      />

      <PageContainer>
        <SafeAreaView className="w-50 h-full flex-1 bg-card px-10">
          <View className="h-24" />
          <Text className="py-2 text-lg font-black">请先阅读：</Text>
          <Text className="text-base leading-10 tracking-wider text-gray-400">
            给每个老师评议的时候，都需亲自输入评分和评语。若没有输入评语，则系统自动匹配评语。
            {'\n'}
            功能试运行，若有问题，可关闭重新开启 APP，亦可通过我的-帮助与反馈加群进行反馈。
          </Text>
          <View className="h-44" />
          <Link href="/toolbox/onekey-comment/form" asChild>
            <Button>
              <Text>确认</Text>
            </Button>
          </Link>
        </SafeAreaView>
      </PageContainer>
    </>
  );
}
