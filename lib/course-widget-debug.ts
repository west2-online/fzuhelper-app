import { CLASS_SCHEDULES_MINUTES, COURSE_WIDGET_DEBUG_SCENARIO_KEY } from '@/lib/constants';
import type { CourseWidgetSnapshot, WidgetCourseEvent } from '@/lib/course-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const COURSE_WIDGET_DEBUG_SCENARIOS = [
  { value: 'courses', label: '今日与明日课程' },
  { value: 'long-text', label: '长课名、长教室与多行备注' },
  { value: 'tomorrow', label: '今日无课、明日有课' },
  { value: 'empty', label: '今日与明日均无课' },
] as const;

export type CourseWidgetDebugScenario = (typeof COURSE_WIDGET_DEBUG_SCENARIOS)[number]['value'];

export async function getCourseWidgetDebugScenario(): Promise<CourseWidgetDebugScenario | null> {
  const value = await AsyncStorage.getItem(COURSE_WIDGET_DEBUG_SCENARIO_KEY);
  return COURSE_WIDGET_DEBUG_SCENARIOS.find(scenario => scenario.value === value)?.value ?? null;
}

export function buildCourseWidgetDebugSnapshot(
  scenario: CourseWidgetDebugScenario,
  now = Date.now(),
): CourseWidgetSnapshot {
  const today = dayjs(now).utcOffset(8 * 60);
  const tomorrow = today.add(1, 'day');
  const minute = today.hour() * 60 + today.minute();
  const courses = [
    { name: '高等数学', location: '西2-301', remark: 'W13周五运动会不上课' },
    { name: '数据结构', location: '东3-406', remark: '' },
    { name: '大学英语', location: '西1-201', remark: '' },
    { name: '大学物理', location: '东2-302', remark: '' },
    { name: '软件工程', location: '西3-501', remark: '' },
  ];
  if (scenario === 'long-text') {
    courses[0] = {
      name: '人工智能与机器学习实践课程',
      location: '计算机与大数据学院实验教学中心',
      remark: '实验课教师必须与理论课教师相同。8学时课外完成。302+307',
    };
    courses[1] = {
      name: '计算机网络原理与实验课程',
      location: '旗山校区公共教学楼',
      remark: '',
    };
  }

  const events: WidgetCourseEvent[] = [];
  if (scenario !== 'empty') {
    if (scenario !== 'tomorrow') {
      // 今日课程按当前时间生成，保证夜间测试时也有未结束的课程。
      events.push(
        ...courses.map((course, index) => {
          const startMinute = index === 0 ? Math.max(0, minute - 10) : Math.min(1439, minute + index * 50);
          return {
            ...course,
            date: today.format('YYYY-MM-DD'),
            startMinute,
            endMinute: Math.min(1440, startMinute + 40),
          };
        }),
      );
    }
    events.push(
      ...courses.map((course, index) => ({
        ...course,
        date: tomorrow.format('YYYY-MM-DD'),
        startMinute: CLASS_SCHEDULES_MINUTES[index * 2][0],
        endMinute: CLASS_SCHEDULES_MINUTES[index * 2 + 1][1],
      })),
    );
  }

  return {
    version: 2,
    timeZone: 'Asia/Shanghai',
    startDate: today.format('YYYY-MM-DD'),
    endDate: tomorrow.format('YYYY-MM-DD'),
    events,
  };
}
