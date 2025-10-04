import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreditCard } from '@/components/academic/CreditCard';
import { DescriptionList } from '@/components/DescriptionList';
import PageContainer from '@/components/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getApiV2JwchAcademicCredit } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import MultiStateView from '@/components/multistateview/multi-state-view';
import useApiRequest from '@/hooks/useApiRequest';
import useMultiStateRequest from '@/hooks/useMultiStateRequest';

// 学分组卡片
const CreditGroupCard = ({ title, items }: { title: string; items: { key: string; value: unknown }[] }) => (
  <Card className="overflow-hidden rounded-2xl border border-border/40 bg-card/80">
    <CardHeader className="space-y-1.5 px-5 pb-3 pt-5">
      <CardTitle className="text-xl font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-4 px-5 pb-5 pt-0">
      <DescriptionList className="gap-4">
        {items.map((item, idx) => (
          <CreditCard key={`${title}-${idx}`} label={item.key} value={item.value} />
        ))}
      </DescriptionList>
    </CardContent>
  </Card>
);

export default function CreditsPage() {
  const apiResult = useApiRequest(getApiV2JwchAcademicCredit);
  const { data: creditData, dataUpdatedAt, isFetching, refetch } = apiResult;
  const lastUpdated = useMemo(() => new Date(dataUpdatedAt), [dataUpdatedAt]); // 数据最后更新时间

  const { state } = useMultiStateRequest(apiResult, {
    emptyCondition: data => !data || data.length === 0,
  });

  type CreditItem = { key: string; value: unknown };
  type CreditGroup = { type?: string; data?: CreditItem[] };

  const groups = (creditData ?? []) as CreditGroup[];
  const hasMinor = groups.some(g => /辅修/.test(g.type ?? '') && (g.data ?? []).length > 0);

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
                <View className="gap-4">
                  {hasMinor ? (
                    groups.map((group, idx) => (
                      <CreditGroupCard key={idx} title={group.type ?? '学分情况'} items={group.data ?? []} />
                    ))
                  ) : (
                    <CreditGroupCard title={groups[0]?.type ?? '学分情况'} items={groups.flatMap(g => g.data ?? [])} />
                  )}
                </View>

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
