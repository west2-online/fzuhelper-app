import dayjs, { type Dayjs } from 'dayjs';

import { getApiV1CommonJobFair } from '@/api/generate/common';

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export interface JobFairItem {
  id: string;
  title: string;
  place: string;
  startsAt: Dayjs;
  detailUrl: string;
}

export interface JobFairDayGroup {
  dateKey: string;
  dateLabel: string;
  items: JobFairItem[];
}

export type JobFairListRow =
  // FlatList 同时渲染日期分组、分区标题和已结束卡片
  | {
      key: string;
      type: 'dayGroup';
      group: JobFairDayGroup;
    }
  | {
      key: string;
      type: 'endedTitle';
    }
  | {
      key: string;
      type: 'endedItem';
      item: JobFairItem;
    };

function groupItemsByDate(items: JobFairItem[]): JobFairDayGroup[] {
  const grouped = new Map<string, JobFairItem[]>();

  items.forEach(item => {
    const dateKey = item.startsAt.format('YYYY-MM-DD');
    const current = grouped.get(dateKey) ?? [];
    current.push(item);
    grouped.set(dateKey, current);
  });

  return Array.from(grouped.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([dateKey, dayItems]) => {
      const currentDate = dayjs(dateKey);
      return {
        dateKey,
        dateLabel: `${currentDate.format('M 月 D 日')} · ${WEEKDAY_LABELS[currentDate.day()]}`,
        items: dayItems.sort((a, b) => a.startsAt.valueOf() - b.startsAt.valueOf()),
      };
    });
}

export function buildJobFairListRows(groups: JobFairDayGroup[], now: Dayjs): JobFairListRow[] {
  const upcomingGroups: JobFairDayGroup[] = [];
  const endedItems: JobFairItem[] = [];

  // 未结束的活动继续按日期分组；已结束的活动统一收进「已结束」分区
  groups.forEach(group => {
    const upcomingItems: JobFairItem[] = [];

    group.items.forEach(item => {
      if (item.startsAt.isBefore(now)) {
        endedItems.push(item);
      } else {
        upcomingItems.push(item);
      }
    });

    if (upcomingItems.length) {
      upcomingGroups.push({
        ...group,
        items: upcomingItems,
      });
    }
  });

  const rows: JobFairListRow[] = upcomingGroups.map(group => ({
    key: `day-${group.dateKey}`,
    type: 'dayGroup',
    group,
  }));

  if (endedItems.length > 0) {
    rows.push({ key: 'ended-title', type: 'endedTitle' });
    rows.push(
      ...endedItems
        .sort((a, b) => b.startsAt.valueOf() - a.startsAt.valueOf())
        .map(item => ({
          key: `ended-${item.id}`,
          type: 'endedItem' as const,
          item,
        })),
    );
  }

  return rows;
}

export async function fetchJobFairMonthData(month: Dayjs): Promise<JobFairDayGroup[]> {
  const response = await getApiV1CommonJobFair({ month: month.format('YYYY-MM') });
  const normalizedItems = response.data.data.events.map<JobFairItem>(item => {
    const startsAt = dayjs.unix(item.starts_at);

    return {
      id: item.id,
      title: item.title,
      place: item.place,
      startsAt,
      detailUrl: item.detail_url,
    };
  });

  return groupItemsByDate(normalizedItems);
}
