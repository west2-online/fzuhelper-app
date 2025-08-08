import { Stack } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { DescriptionList } from '@/components/DescriptionList';
import { CreditCard } from '@/components/academic/CreditCard';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';

import { getApiV1JwchAcademicCredit } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import useApiRequest from '@/hooks/useApiRequest';
import { useMemo } from 'react';

const errorHandler = (data: any) => {
  if (data) toast.error(data.msg || '发生未知错误，请稍后再试');
};

export default function CreditsPage() {
  const {
    data: creditData,
    dataUpdatedAt,
    isLoading,
    refetch,
  } = useApiRequest(getApiV1JwchAcademicCredit, {}, { errorHandler });
  const lastUpdated = useMemo(() => new Date(dataUpdatedAt), [dataUpdatedAt]); // 数据最后更新时间

  return (
    <>
      <Stack.Screen options={{ headerTitle: '学分统计' }} />
      {isLoading ? (
        <Loading />
      ) : (
        <PageContainer>
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pt-4"
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          >
            {creditData && creditData.length > 0 && (
              <>
                <SafeAreaView className="flex-1" edges={['bottom']}>
                  <DescriptionList className="gap-6">
                    {creditData.map((credit, index) => (
                      <CreditCard key={index} type={credit.type} gain={credit.gain} total={credit.total} />
                    ))}
                  </DescriptionList>

                  {/* 显示最后更新时间 */}
                  <LastUpdateTime lastUpdated={lastUpdated} />
                </SafeAreaView>
              </>
            )}
          </ScrollView>
        </PageContainer>
      )}
    </>
  );
}
