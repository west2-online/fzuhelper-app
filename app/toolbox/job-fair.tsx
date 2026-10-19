import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Stack } from 'expo-router';
import { CalendarDaysIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, TouchableOpacity, View, type ListRenderItem } from 'react-native';
import { Pressable as GesturePressable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { useTheme } from '@/components/app-theme-provider';
import MultiStateView, { STATE } from '@/components/multistateview/multi-state-view';
import PageContainer from '@/components/page-container';
import PickerModal from '@/components/picker-modal';
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
  const { isDarkTheme } = useTheme();
  const timeLabel = isEnded ? item.startsAt.format('M 月 D 日 HH:mm') : item.startsAt.format('HH:mm');
  const metadataColor = isEnded ? (isDarkTheme ? '#a1a1aa' : '#71717a') : isDarkTheme ? '#858585' : '#999999';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${item.title}，${timeLabel}${item.place ? `，${item.place}` : ''}`}
      accessibilityHint="打开活动详情"
      activeOpacity={0.7}
      onPress={() => pushToWebViewNormal(item.detailUrl, '活动详情')}
    >
      <Card className={cn('rounded-2xl px-4 py-4', isEnded && 'bg-muted')}>
        <Text className={cn('mb-3 text-base font-medium leading-6', isEnded && 'text-muted-foreground')}>
          {item.title}
        </Text>

        <View className="flex-row items-center">
          <Icon name="time-outline" size={16} color={metadataColor} className="mr-2" />
          <Text className={cn('shrink-0 text-sm text-text-secondary', isEnded && 'text-muted-foreground')}>
            {timeLabel}
          </Text>
          {item.place ? (
            <View className="ml-4 min-w-0 flex-1 flex-row items-center">
              <Icon name="location-outline" size={16} color={metadataColor} className="mr-2" />
              <Text
                className={cn('flex-1 text-sm text-text-secondary', isEnded && 'text-muted-foreground')}
                numberOfLines={1}
              >
                {item.place}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function EventDayGroup({ group }: { group: JobFairDayGroup }) {
  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between px-0.5">
        <Text className="text-base font-semibold">{group.dateLabel}</Text>
        <Text className="text-sm text-muted-foreground">{group.items.length} 场</Text>
      </View>
      <View className="gap-2">
        {group.items.map(item => (
          <EventCard key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
}

function EndedSectionTitle() {
  return (
    <View className="flex-row items-center gap-3 pt-1">
      <Text className="text-sm font-semibold text-muted-foreground">已结束</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}

function MonthFilterButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { isDarkTheme } = useTheme();

  return (
    <GesturePressable accessibilityRole="button" accessibilityLabel={`筛选月份，当前为${label}`} onPress={onPress}>
      <View className="flex-row items-center">
        <Text className="pr-2 text-lg">{label}</Text>
        <CalendarDaysIcon size={20} color={isDarkTheme ? 'white' : 'black'} />
      </View>
    </GesturePressable>
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
  const [isMonthPickerVisible, setMonthPickerVisible] = useState(false);
  const selectedMonthKey = selectedMonth.format('YYYY-MM');
  const monthPickerData = useMemo(() => {
    const baseMonth = dayjs().startOf('month');
    return Array.from({ length: 61 }, (_, index) => baseMonth.subtract(36, 'month').add(index, 'month')).map(month => ({
      value: month.format('YYYY-MM'),
      label: month.format('YYYY 年 M 月'),
    }));
  }, []);
  const renderHeaderRight = useCallback(
    () => <MonthFilterButton label={selectedMonthKey} onPress={() => setMonthPickerVisible(true)} />,
    [selectedMonthKey],
  );

  const { data, error, isError, isFetching, refetch } = useQuery({
    queryKey: ['job-fair-month', selectedMonthKey],
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
          headerRight: renderHeaderRight,
        }}
      />
      <PageContainer>
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
              contentContainerClassName="mx-4 py-3 gap-4"
              refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
            />
          }
          refresh={refetch}
        />
      </PageContainer>
      {/* 月份选择器 */}
      <PickerModal
        visible={isMonthPickerVisible}
        title="选择月份"
        data={monthPickerData}
        value={selectedMonthKey}
        onClose={() => setMonthPickerVisible(false)}
        onConfirm={month => {
          setSelectedMonth(dayjs(`${month}-01`));
          setMonthPickerVisible(false);
        }}
      />
    </>
  );
}
