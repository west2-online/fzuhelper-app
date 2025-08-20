import { Stack } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UnifiedExamCard } from '@/components/academic/UnifiedExamCard';
import PageContainer from '@/components/page-container';

import { getApiV1JwchAcademicUnifiedExam } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import MultiStateView from '@/components/multistateview/multi-state-view';
import useApiRequest from '@/hooks/useApiRequest';
import useMultiStateRequest from '@/hooks/useMultiStateRequest';

export default function UnifiedExamScorePage() {
  // 获取统考成绩数据
  const apiResult = useApiRequest(getApiV1JwchAcademicUnifiedExam);
  const { data: unifiedExamData, dataUpdatedAt, isFetching, refetch } = apiResult;
  const lastUpdated = new Date(dataUpdatedAt);

  const { state } = useMultiStateRequest(apiResult, {
    emptyCondition: data => !data || data.length === 0,
  });

  return (
    <>
      <Stack.Screen options={{ title: '统考成绩' }} />
      <PageContainer>
        <MultiStateView
          state={state}
          className="flex-1"
          content={
            <ScrollView
              contentContainerClassName="px-4 pt-4"
              refreshControl={
                <RefreshControl
                  refreshing={isFetching}
                  // 下拉刷新逻辑
                  onRefresh={refetch}
                />
              }
            >
              <SafeAreaView className="flex-1" edges={['bottom']}>
                {unifiedExamData?.map((item, index) => <UnifiedExamCard key={index} item={item} />)}
                {/* 显示最后更新时间 */}
                <LastUpdateTime lastUpdated={lastUpdated} />
              </SafeAreaView>
            </ScrollView>
          }
          refresh={refetch}
        />
      </PageContainer>
    </>
  );
}
