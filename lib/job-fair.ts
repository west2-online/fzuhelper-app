import { Buffer } from '@craftzdog/react-native-buffer';
import dayjs, { type Dayjs } from 'dayjs';

import { post } from '@/modules/native-request';

const JOB_FAIR_API_URL = 'http://fjrclh.fzu.edu.cn/CmsInterface/getDateZPHKeynoteList_month';
const JOB_FAIR_DETAIL_URL = 'http://fjrclh.fzu.edu.cn/cms/zphdetail.html';
const LECTURE_DETAIL_URL = 'http://fjrclh.fzu.edu.cn/cms/xjhdetail.html';

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
  title: string | null;
  place: string | null;
  // 源站用 YYYYMMDD 表示日期，用 time 表示当天时间
  start_time: string;
  time: string;
  zphval: string;
}

interface JobFairApiResponse {
  success: boolean;
  zhaopinhui_keynoteList: JobFairApiItem[];
}

export interface JobFairItem {
  id: string;
  title: string;
  place: string;
  time: string;
  startsAt: Dayjs;
  dateKey: string;
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

function decodeHtmlEntities(value: string | null | undefined) {
  return (value ?? '').replace(/&(#x?[\da-fA-F]+|[a-zA-Z]+);/g, (fullMatch, entity: string) => {
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
        .sort((a, b) => a.startsAt.valueOf() - b.startsAt.valueOf())
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
  const response = await post(
    JOB_FAIR_API_URL,
    {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    {
      dateday: month.format('YYYY/MM'),
    },
  );

  if (response.status < 200 || response.status >= 300) {
    throw new Error('招聘会数据加载失败');
  }

  const rawText = Buffer.from(response.data).toString('utf-8');
  let parsed: JobFairApiResponse;

  try {
    parsed = JSON.parse(rawText) as JobFairApiResponse;
  } catch {
    throw new Error('招聘会数据解析失败');
  }

  if (!parsed.success) {
    throw new Error('招聘会数据加载失败');
  }

  const normalizedItems = parsed.zhaopinhui_keynoteList.map<JobFairItem>(item => {
    // start_time 形如 20260401，time 形如 15:00，组合后用于排序和判断是否已结束。
    const dateText = `${item.start_time.slice(0, 4)}-${item.start_time.slice(4, 6)}-${item.start_time.slice(6, 8)}`;
    const startsAt = dayjs(`${dateText} ${item.time}`);

    return {
      id: item.id,
      title: decodeHtmlEntities(item.title).trim(),
      place: decodeHtmlEntities(item.place).trim(),
      time: item.time,
      startsAt,
      dateKey: dateText,
      // zphval === '3' 代表宣讲会，其他值代表招聘会
      detailUrl: `${item.zphval === '3' ? LECTURE_DETAIL_URL : JOB_FAIR_DETAIL_URL}?id=${item.id}`,
    };
  });

  return groupItemsByDate(normalizedItems);
}
