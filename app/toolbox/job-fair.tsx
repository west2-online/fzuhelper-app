import { Buffer } from '@craftzdog/react-native-buffer';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View, useColorScheme } from 'react-native';

import { Icon } from '@/components/Icon';
import MultiStateView, { STATE } from '@/components/multistateview/multi-state-view';
import PageContainer from '@/components/page-container';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { pushToWebViewNormal } from '@/lib/webview';
import { post } from '@/modules/native-request';
import { toast } from 'sonner-native';

const JOB_FAIR_API_URL = 'http://fjrclh.fzu.edu.cn/CmsInterface/getDateZPHKeynoteList_month';
const JOB_FAIR_DETAIL_URL = 'http://fjrclh.fzu.edu.cn/cms/zphdetail.html';
const LECTURE_DETAIL_URL = 'http://fjrclh.fzu.edu.cn/cms/xjhdetail.html';
const MONTH_PAYLOAD_FORMAT = 'YYYY/MM';
const DATE_KEY_FORMAT = 'YYYY-MM-DD';
const MONTH_TITLE_FORMAT = 'YYYY 年 M 月';

// 站点返回的标题里会混有 HTML 实体，需要在列表展示前手动解码。
const HTML_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  apos: "'",
  quot: '"',
  nbsp: ' ',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  middot: '·',
};

interface JobFairApiItem {
  id: string;
  title: string;
  place: string;
  start_time: string;
  starttime: string;
  time: string;
  zphval: string;
}

interface JobFairApiResponse {
  success: boolean;
  zph_kn_count: number;
  zhaopinhui_keynoteList: JobFairApiItem[];
}

interface JobFairItem {
  id: string;
  title: string;
  place: string;
  time: string;
  startsAt: Dayjs;
  dateKey: string;
  detailUrl: string;
}

interface JobFairDayGroup {
  dateKey: string;
  dateLabel: string;
  items: JobFairItem[];
}

interface JobFairMonthData {
  groups: JobFairDayGroup[];
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x?[\da-fA-F]+|[a-zA-Z]+);/g, (fullMatch, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(codePoint) ? fullMatch : String.fromCodePoint(codePoint);
    }

    if (entity.startsWith('#')) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? fullMatch : String.fromCodePoint(codePoint);
    }

    return HTML_ENTITY_MAP[entity] ?? fullMatch;
  });
}

function parseStartTime(starttime: string, startTime: string) {
  // 优先使用更完整的 starttime；部分数据只有 start_time（YYYYMMDD）时再回退到日期级精度。
  if (starttime) {
    const parsed = dayjs(starttime);
    if (parsed.isValid()) {
      return parsed;
    }
  }

  if (startTime?.length === 8) {
    return dayjs(`${startTime.slice(0, 4)}-${startTime.slice(4, 6)}-${startTime.slice(6, 8)} 00:00:00`);
  }

  return dayjs('');
}

function groupItemsByDate(items: JobFairItem[]): JobFairDayGroup[] {
  const grouped = new Map<string, JobFairItem[]>();

  items.forEach(item => {
    const current = grouped.get(item.dateKey) ?? [];
    current.push(item);
    grouped.set(item.dateKey, current);
  });

  return Array.from(grouped.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([dateKey, dayItems]) => {
      const currentDate = dayjs(dateKey);
      return {
        dateKey,
        dateLabel: currentDate.format('M 月 D 日'),
        items: dayItems.sort((a, b) => a.startsAt.valueOf() - b.startsAt.valueOf()),
      };
    });
}

async function fetchJobFairMonthData(month: Dayjs): Promise<JobFairMonthData> {
  const response = await post(
    JOB_FAIR_API_URL,
    {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    {
      dateday: month.format(MONTH_PAYLOAD_FORMAT),
    },
  );

  const rawText = Buffer.from(response.data).toString('utf-8');
  const parsed = JSON.parse(rawText) as JobFairApiResponse;

  if (!parsed.success) {
    throw new Error('招聘会数据加载失败');
  }

  const normalizedItems = (parsed.zhaopinhui_keynoteList ?? [])
    .map<JobFairItem | null>(item => {
      const startsAt = parseStartTime(item.starttime, item.start_time);
      if (!startsAt.isValid()) {
        return null;
      }

      return {
        id: item.id,
        title: decodeHtmlEntities(item.title ?? '').trim(),
        place: decodeHtmlEntities(item.place ?? '').trim(),
        time: item.time || startsAt.format('HH:mm'),
        startsAt,
        dateKey: startsAt.format(DATE_KEY_FORMAT),
        // zphval === '3' 代表宣讲会，其他值代表招聘会
        detailUrl: `${item.zphval === '3' ? LECTURE_DETAIL_URL : JOB_FAIR_DETAIL_URL}?id=${item.id}`,
      };
    })
    .filter((item): item is JobFairItem => item !== null);

  return {
    groups: groupItemsByDate(normalizedItems),
  };
}

function EventCard({ item }: { item: JobFairItem }) {
  const handlePress = useCallback(() => {
    pushToWebViewNormal(item.detailUrl, '活动详情');
  }, [item]);

  return (
    <Pressable className="mb-3 active:opacity-80" onPress={handlePress}>
      <Card className="rounded-2xl px-4 py-4">
        <View className="mb-3">
          <Text className="text-base font-medium leading-6">{item.title}</Text>
        </View>

        <View className="flex-row items-center">
          <Icon name="time-outline" size={16} className="mr-2" />
          <Text className="text-sm text-text-secondary">{`${item.startsAt.format('M 月 D 日')} ${item.time}`}</Text>
        </View>

        {item.place ? (
          <View className="mt-2 flex-row items-center">
            <Icon name="location-outline" size={16} className="mr-2" />
            <Text className="flex-1 text-sm text-text-secondary">{item.place}</Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

function EventDayGroup({ group }: { group: JobFairDayGroup }) {
  return (
    <View className="mb-2">
      <View className="mb-3 flex-row items-center">
        <Text className="text-base font-semibold">{group.dateLabel}</Text>
      </View>
      {group.items.map(item => (
        <EventCard key={item.id} item={item} />
      ))}
    </View>
  );
}

function EventList({ groups }: { groups: JobFairDayGroup[] }) {
  return groups.map(group => <EventDayGroup key={group.dateKey} group={group} />);
}

export default function JobFairPage() {
  const colorScheme = useColorScheme();
  const [selectedMonth, setSelectedMonth] = useState(() => dayjs().startOf('month'));

  const { data, error, isError, isFetching, refetch } = useQuery({
    queryKey: ['job-fair-month', selectedMonth.format(MONTH_PAYLOAD_FORMAT)],
    queryFn: () => fetchJobFairMonthData(selectedMonth),
  });

  useEffect(() => {
    if (isError) {
      toast.error(error instanceof Error ? error.message : '招聘会数据加载失败');
    }
  }, [error, isError]);

  const state = useMemo(() => {
    if (isFetching && !data) {
      return STATE.LOADING;
    }

    if (isError) {
      return STATE.ERROR;
    }

    const totalItems = data?.groups.length ?? 0;
    if (!data || totalItems === 0) {
      return STATE.EMPTY;
    }

    return STATE.CONTENT;
  }, [data, isError, isFetching]);

  const handlePreviousMonth = useCallback(() => {
    setSelectedMonth(current => current.subtract(1, 'month'));
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth(current => current.add(1, 'month'));
  }, []);

  const content = useMemo(() => {
    if (!data) {
      return <View className="flex-1" />;
    }

    return (
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colorScheme === 'dark' ? '#fff' : '#000'}
          />
        }
      >
        <EventList groups={data.groups} />
      </ScrollView>
    );
  }, [colorScheme, data, isFetching, refetch]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '招聘会',
        }}
      />
      <PageContainer>
        <View className="border-b border-border bg-background px-4 pb-3 pt-2">
          <View className="flex-row items-center justify-between">
            <Pressable className="rounded-full p-2" onPress={handlePreviousMonth}>
              <Icon name="chevron-back-outline" size={20} />
            </Pressable>
            <Text className="text-lg font-semibold">{selectedMonth.format(MONTH_TITLE_FORMAT)}</Text>
            <Pressable className="rounded-full p-2" onPress={handleNextMonth}>
              <Icon name="chevron-forward-outline" size={20} />
            </Pressable>
          </View>
        </View>

        <MultiStateView state={state} className="flex-1" content={content} refresh={refetch} />
      </PageContainer>
    </>
  );
}
