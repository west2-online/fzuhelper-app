import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { UnifiedExamCard } from '@/components/academic/UnifiedExamCard';
import PageContainer from '@/components/page-container';

import { getApiV1JwchAcademicUnifiedExam } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import MultiStateView, { STATE } from '@/components/multistateview/multi-state-view';
import useApiRequest from '@/hooks/useApiRequest';

export default function UnifiedExamScorePage() {
  const [state, setState] = useState(STATE.LOADING);
  // 获取统考成绩数据
  const {
    data: unifiedExamData,
    dataUpdatedAt,
    isFetching,
    isError,
    error,
    refetch,
  } = useApiRequest(getApiV1JwchAcademicUnifiedExam);
  const lastUpdated = new Date(dataUpdatedAt);

  useEffect(() => {
    if (isFetching) {
      setState(STATE.LOADING);
    } else if (isError) {
      if (error && error.message) {
        toast.error(error.message);
      }
      setState(STATE.ERROR);
    } else if (!unifiedExamData || unifiedExamData.length === 0) {
      setState(STATE.EMPTY);
    } else {
      setState(STATE.CONTENT);
    }
  }, [isFetching, isError, error, unifiedExamData]);

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
