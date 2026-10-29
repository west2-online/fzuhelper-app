export const WIDGET_STORE_NAME: string = 'fzuhelper_widget';
export const WIDGET_DATA_KEY: string = 'widget_data';
export const WIDGET_FORM_IDS_KEY: string = 'form_ids';

// Keep this protocol in sync with lib/course-widget.ts. The app expands weeks,
// filters hidden courses and resolves actual exam times before publishing it.
export interface WidgetCourseEvent {
  date: string;
  name: string;
  location: string;
  remark: string;
  startMinute: number;
  endMinute: number;
}

export interface CourseWidgetSnapshot {
  version: number;
  timeZone: string;
  startDate: string;
  endDate: string;
  events: WidgetCourseEvent[];
}

interface CourseWidgetCache {
  widgetSnapshot?: CourseWidgetSnapshot;
}

export interface WidgetEventBinding {
  name: string;
  location: string;
  remark: string;
  timeText: string;
}

export interface WidgetDayBinding {
  title: string;
  weekday: string;
  isTomorrow: boolean;
  events: WidgetEventBinding[];
  emptyText: string;
}

export interface WidgetBindingData {
  hasSnapshot: boolean;
  message: string;
  today: WidgetDayBinding;
  tomorrow: WidgetDayBinding;
  smallDay: WidgetDayBinding;
  showRemarks: boolean;
  verticalInset: number;
  courseName: string;
  courseLocation: string;
  courseTime: string;
}

const DAY_MS: number = 86_400_000;
const MINUTE_MS: number = 60_000;
const SHANGHAI_OFFSET_MS: number = 8 * 60 * MINUTE_MS;
const TOMORROW_MINUTE: number = 21 * 60 + 35;

export function emptyWidgetDay(): WidgetDayBinding {
  return { title: '', weekday: '', isTomorrow: false, events: [], emptyText: '' };
}

export function buildWidgetBindingData(
  json: string,
  showRemarks: boolean = true,
  previewTomorrow: boolean = false,
  verticalInset: number = 0,
  now: number = Date.now(),
): WidgetBindingData {
  const data: WidgetBindingData = {
    hasSnapshot: false,
    message: '请打开福uu同步课表',
    today: emptyWidgetDay(),
    tomorrow: emptyWidgetDay(),
    smallDay: emptyWidgetDay(),
    showRemarks,
    verticalInset,
    courseName: '请打开福uu同步课表',
    courseLocation: '',
    courseTime: '',
  };
  if (json.length === 0) return data;

  try {
    const snapshot = readSnapshot(json);
    if (snapshot === undefined) return data;
    const date = shanghaiDate(now);
    const minute = date.getUTCHours() * 60 + date.getUTCMinutes();
    data.hasSnapshot = true;
    data.message = '';
    data.today = buildDay(snapshot, date, minute, false);
    data.tomorrow = buildDay(snapshot, new Date(date.getTime() + DAY_MS), minute, true);
    data.smallDay = data.today.events.length === 0 && (previewTomorrow || minute >= TOMORROW_MINUTE)
      ? data.tomorrow : data.today;
    const first = data.smallDay.events[0];
    data.courseName = first === undefined ? data.smallDay.emptyText : first.name;
    data.courseLocation = first === undefined ? '' : first.location;
    data.courseTime = first === undefined ? ''
      : `${data.smallDay.isTomorrow ? '明日 ' : ''}${first.timeText}`;
  } catch (error) {
    data.message = '课表数据异常，请重新同步';
    data.courseName = data.message;
  }
  return data;
}

// FormKit's minimum delay is five minutes. Fixed school period endpoints,
// 21:35 and midnight are also declared in form_config.json as recovery points.
export function nextWidgetRefreshMinutes(json: string, now: number = Date.now()): number {
  const date = shanghaiDate(now);
  const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - SHANGHAI_OFFSET_MS;
  let next = dayStart + DAY_MS;
  const evening = dayStart + TOMORROW_MINUTE * MINUTE_MS;
  if (evening > now) next = Math.min(next, evening);
  try {
    const snapshot = readSnapshot(json);
    if (snapshot !== undefined) {
      const key = dateKey(date);
      for (const event of snapshot.events) {
        const end = dayStart + event.endMinute * MINUTE_MS;
        if (event.date === key && end > now) next = Math.min(next, end);
      }
    }
  } catch (error) {
    // A subsequent app sync can repair invalid data; still refresh the date.
  }
  return Math.max(5, Math.ceil((next - now) / MINUTE_MS));
}

function readSnapshot(json: string): CourseWidgetSnapshot | undefined {
  const cache = JSON.parse(json) as CourseWidgetCache;
  if (cache === null || cache.widgetSnapshot === undefined || cache.widgetSnapshot === null) return undefined;
  const snapshot = cache.widgetSnapshot;
  if (snapshot.version !== 2) return undefined;
  // The producer explicitly uses Asia/Shanghai. Do not silently use the device's
  // timezone when the user travels or when the emulator is configured in UTC.
  if (snapshot.timeZone !== 'Asia/Shanghai' || !isDateKey(snapshot.startDate)
    || !isDateKey(snapshot.endDate) || snapshot.startDate > snapshot.endDate
    || !Array.isArray(snapshot.events)) {
    throw new Error('Invalid course widget snapshot');
  }
  for (const event of snapshot.events) {
    if (event === null || !isDateKey(event.date) || typeof event.name !== 'string'
      || typeof event.location !== 'string' || typeof event.remark !== 'string'
      || !Number.isInteger(event.startMinute) || !Number.isInteger(event.endMinute)
      || event.startMinute < 0 || event.startMinute >= event.endMinute || event.endMinute > 1440) {
      throw new Error('Invalid course widget event');
    }
  }
  return snapshot;
}

function buildDay(snapshot: CourseWidgetSnapshot, date: Date, minute: number, tomorrow: boolean): WidgetDayBinding {
  const key = dateKey(date);
  const courses = snapshot.events.filter((event: WidgetCourseEvent) => event.date === key);
  const remaining = courses.filter((event: WidgetCourseEvent) => tomorrow || event.endMinute > minute)
    .sort((left: WidgetCourseEvent, right: WidgetCourseEvent) => left.startMinute - right.startMinute);
  let emptyText = courses.length === 0 ? '今日没有课程' : '今日课程已结束';
  if (key < snapshot.startDate) emptyText = '尚未开学';
  else if (key > snapshot.endDate) emptyText = '本学期已结束';
  else if (tomorrow) emptyText = '明日没有课程';
  const weekdays: string[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return {
    title: tomorrow ? '明日课程' : `${twoDigits(date.getUTCMonth() + 1)}月${twoDigits(date.getUTCDate())}日`,
    weekday: weekdays[date.getUTCDay()],
    isTomorrow: tomorrow,
    events: remaining.map((event: WidgetCourseEvent): WidgetEventBinding => ({
      name: event.name,
      location: event.location,
      remark: event.remark,
      timeText: `${minuteText(event.startMinute)}-${minuteText(event.endMinute)}`,
    })),
    emptyText,
  };
}

function shanghaiDate(now: number): Date {
  return new Date(now + SHANGHAI_OFFSET_MS);
}

function dateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${twoDigits(date.getUTCMonth() + 1)}-${twoDigits(date.getUTCDate())}`;
}

function isDateKey(value: string): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && dateKey(date) === value;
}

function minuteText(minute: number): string {
  return `${twoDigits(Math.floor(minute / 60))}:${twoDigits(minute % 60)}`;
}

function twoDigits(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}
