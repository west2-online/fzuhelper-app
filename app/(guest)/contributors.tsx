import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import ContributorsDOMComponent from '@/components/dom/contributors';

// 这个页面更多地作为一种测试用途，用于展示 DOM 组件的使用
// 复杂的页面可以使用 DOM 组件来简化开发流程，毕竟相应的 Native 组件不太好做
// -- Baoshuo <i@baoshuo.ren>, 2025-02-06

export default function Contributors() {
  return (
    <>
      <Stack.Screen options={{ title: '贡献者列表' }} />

      <SafeAreaView className="h-full w-full" edges={['bottom']}>
        <ContributorsDOMComponent />
      </SafeAreaView>
    </>
  );
}
