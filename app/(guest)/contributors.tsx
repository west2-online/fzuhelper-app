import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiV1CommonContributor } from '@/api/generate';
import ContributorsDOMComponent from '@/components/dom/contributors';
import PageContainer from '@/components/page-container';
import useApiRequest from '@/hooks/useApiRequest';

// 这个页面更多地作为一种测试用途，用于展示 DOM 组件的使用
// 复杂的页面可以使用 DOM 组件来简化开发流程，毕竟相应的 Native 组件不太好做
// -- Baoshuo <i@baoshuo.ren>, 2025-02-06

export default function Contributors() {
  const { data } = useApiRequest(getApiV1CommonContributor, {});
  const { colorScheme } = useColorScheme();

  return (
    <>
      <Stack.Screen options={{ title: '贡献名录' }} />

      <PageContainer>
        <SafeAreaView className="h-full w-full" edges={['bottom']}>
          {/* 在原生端传入 colorScheme，防止出现闪动 */}
          {data && <ContributorsDOMComponent data={data} colorScheme={colorScheme} />}
        </SafeAreaView>
      </PageContainer>
    </>
  );
}
