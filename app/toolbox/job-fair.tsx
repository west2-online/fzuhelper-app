import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, TouchableOpacity, View, type ListRenderItem } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import MultiStateView, { STATE } from '@/components/multistateview/multi-state-view';
import PageContainer from '@/components/page-container';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  buildJobFairListRows,
  fetchJobFairMonthData,
  type JobFairDayGroup,
  type JobFairItem,
  type JobFairListRow,
} from '@/lib/job-fair';
import { cn } from '@/lib/utils';
import { pushToWebViewNormal } from '@/lib/webview';
import { toast } from 'sonner-native';

function EventCard({ item, isEnded }: { item: JobFairItem; isEnded?: boolean }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => pushToWebViewNormal(item.detailUrl, '活动详情')}>
      <Card className={cn('rounded-2xl px-4 py-4', isEnded && 'bg-muted')}>
        <View className="mb-3">
          <Text className={cn('text-base font-medium leading-6', isEnded && 'text-muted-foreground')}>
            {item.title}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Icon name="time-outline" size={16} className="mr-2" />
          <Text className={cn('text-sm text-text-secondary', isEnded && 'text-muted-foreground')}>
            {`${item.startsAt.format('M 月 D 日')} ${item.time}`}
          </Text>
        </View>

        {item.place ? (
          <View className="mt-2 flex-row items-center">
            <Icon name="location-outline" size={16} className="mr-2" />
            <Text className={cn('flex-1 text-sm text-text-secondary', isEnded && 'text-muted-foreground')}>
              {item.place}
            </Text>
          </View>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

function EventDayGroup({ group }: { group: JobFairDayGroup }) {
  return (
    <View>
      <View className="mb-3 flex-row items-center">
        <Text className="text-base font-semibold">{group.dateLabel}</Text>
      </View>
      <View className="gap-3">
        {group.items.map(item => (
          <EventCard key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
}

function EndedSectionTitle() {
  return (
    <View className="pt-1">
      <Text className="text-base font-semibold text-muted-foreground">已结束</Text>
    </View>
  );
}

const renderItem: ListRenderItem<JobFairListRow> = ({ item }) => {
  if (item.type === 'dayGroup') {
    return <EventDayGroup group={item.group} />;
  }

  if (item.type === 'endedTitle') {
    return <EndedSectionTitle />;
  }

  return <EventCard item={item.item} isEnded />;
};

export default function JobFairPage() {
  const { bottom } = useSafeAreaInsets();
  const [selectedMonth, setSelectedMonth] = useState(() => dayjs().startOf('month'));

  const { data, error, isError, isFetching, refetch } = useQuery({
    queryKey: ['job-fair-month', selectedMonth.format('YYYY/MM')],
    queryFn: () => fetchJobFairMonthData(selectedMonth),
  });

  useEffect(() => {
    if (isError) {
      toast.error(error instanceof Error ? error.message : '招聘会数据加载失败');
    }
  }, [error, isError]);

  const state =
    isFetching && !data ? STATE.LOADING : isError ? STATE.ERROR : !data?.length ? STATE.EMPTY : STATE.CONTENT;
  const rows = buildJobFairListRows(data ?? [], dayjs());

  return (
    <>
      <Stack.Screen
        options={{
          title: '招聘会',
        }}
      />
      <PageContainer>
        {/* 月份选择器 */}
        <View className="border-b border-border bg-background px-4 pb-3 pt-2">
          <View className="flex-row items-center justify-between">
            <Pressable
              className="rounded-full p-2"
              onPress={() => setSelectedMonth(current => current.subtract(1, 'month'))}
            >
              <Icon name="chevron-back-outline" size={20} />
            </Pressable>
            <Text className="text-lg font-semibold">{selectedMonth.format('YYYY 年 M 月')}</Text>
            <Pressable
              className="rounded-full p-2"
              onPress={() => setSelectedMonth(current => current.add(1, 'month'))}
            >
              <Icon name="chevron-forward-outline" size={20} />
            </Pressable>
          </View>
        </View>

        {/* 招聘信息列表 */}
        <MultiStateView
          state={state}
          className="flex-1"
          content={
            <FlatList
              data={rows}
              keyExtractor={item => item.key}
              renderItem={renderItem}
              className="flex-1"
              contentContainerStyle={{ paddingBottom: bottom }}
              contentContainerClassName="mx-4 pt-3 gap-3"
              refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
            />
          }
          refresh={refetch}
        />
      </PageContainer>
    </>
  );
}
