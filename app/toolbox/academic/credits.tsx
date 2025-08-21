import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DescriptionList } from '@/components/DescriptionList';
import { CreditCard } from '@/components/academic/CreditCard';
import PageContainer from '@/components/page-container';

import { getApiV1JwchAcademicCredit } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import MultiStateView from '@/components/multistateview/multi-state-view';
import useApiRequest from '@/hooks/useApiRequest';
import useMultiStateRequest from '@/hooks/useMultiStateRequest';

export default function CreditsPage() {
  const apiResult = useApiRequest(getApiV1JwchAcademicCredit);
  const { data: creditData, dataUpdatedAt, isFetching, refetch } = apiResult;
  const lastUpdated = useMemo(() => new Date(dataUpdatedAt), [dataUpdatedAt]); // 数据最后更新时间

  const { state } = useMultiStateRequest(apiResult, {
    emptyCondition: data => !data || data.length === 0,
  });

  return (
    <>
      <Stack.Screen options={{ headerTitle: '学分统计' }} />
      <PageContainer>
        <MultiStateView
          state={state}
          className="flex-1"
          content={
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 pt-4"
              refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
            >
              <SafeAreaView className="flex-1" edges={['bottom']}>
                <DescriptionList className="gap-6">
                  {creditData?.map((credit, index) => (
                    <CreditCard key={index} type={credit.type} gain={credit.gain} total={credit.total} />
                  ))}
                </DescriptionList>

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
