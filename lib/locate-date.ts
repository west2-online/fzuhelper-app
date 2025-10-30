import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import isoWeekPlugin from 'dayjs/plugin/isoWeek';

import { getApiV1CourseDate } from '@/api/generate';
import type { LocateDateResult } from '@/api/interface';
import { DATE_FORMAT_FULL, JWCH_LOCATE_DATE_CACHE_KEY } from '@/lib/constants';
import { JWCHLocateDateResult } from '@/types/data';

dayjs.extend(isoWeekPlugin);

export async function fetchJwchLocateDate(): Promise<JWCHLocateDateResult> {
  const response = await getApiV1CourseDate();

  return {
    week: +response.data.data.week,
    year: +response.data.data.year,
    term: +response.data.data.term,
  };
}

/**
 * 基于教务处的数据定位今天是第几周，以及今天的日期
 * 返回一个对象，包含 date（当前日期）、week（当前周数）、day（当前星期几）、semester（当前学期，格式样例：202401）
 * e.g. { date: '2024/06/01', week: 23, day: 3, semester: '202401' }
 * 这个函数应当只会在课表业务中涉及
 * 使用了本地缓存，但是缓存逻辑和 PersistentQuery 不同，我们只在跨周时重新获取数据
 * 调用接口取数据，需要用 handleError 做 catch
 * @param noCache 是否使用缓存，默认使用
 */
export default async function locateDate(noCache = false): Promise<LocateDateResult> {
  // 获取当前日期
  const currentDate = dayjs();
  const currentDay = currentDate.isoWeekday(); // 1 表示周一，7 表示周日
  const formattedCurrentDate = currentDate.format(DATE_FORMAT_FULL); // 格式化日期

  // 尝试读取缓存
  if (!noCache) {
    try {
      const cachedData = await AsyncStorage.getItem(JWCH_LOCATE_DATE_CACHE_KEY);

      if (cachedData) {
        const { date: cachedDate, week, year, term } = JSON.parse(cachedData);

        // 如果缓存日期是同一周的，直接返回缓存数据
        if (currentDate.isSame(cachedDate, 'isoWeek')) {
          const semester = `${year}${term.toString().padStart(2, '0')}`;
          console.log('Using cached locate date:', { date: formattedCurrentDate, week, day: currentDay, semester });
          return { date: formattedCurrentDate, week, day: currentDay, semester };
        }
      }
    } catch (error) {
      console.warn('Failed to read cache:', error);
    }
  }

  console.log('Fetching locate date...');
  // 如果缓存不存在、解析失败，或者跨周，则重新获取数据
  const { week, year, term } = await fetchJwchLocateDate();

  // 拼接学期信息
  const semester = `${year}${term.toString().padStart(2, '0')}`;

  // 缓存新数据
  try {
    await AsyncStorage.setItem(
      JWCH_LOCATE_DATE_CACHE_KEY,
      JSON.stringify({ date: formattedCurrentDate, week, year, term }),
    );
  } catch (error) {
    console.warn('Failed to write cache:', error);
  }

  return { date: formattedCurrentDate, week, day: currentDay, semester };
}

// 根据学期开始日期和当前周数获取当前周的第一天日期
export function getFirstDateByWeek(semesterStart: string, currentWeek: number): string {
  const startDate = dayjs(semesterStart);
  const startDayOfWeek = (startDate.day() + 6) % 7; // 将星期日（0）转换为 6，其他天数减 1 对应星期一到星期六
  const adjustedStartDate = startDate.subtract(startDayOfWeek, 'day');

  // 如果学期开始日期不是星期一，则调整到最近的星期一
  const firstDayOfWeek = adjustedStartDate.add((currentWeek - 1) * 7, 'day');

  return firstDayOfWeek.format('YYYY-MM-DD'); // 返回日期字符串格式 YYYY-MM-DD
}

// 根据学期开始日期和当前周数获取当前周的日期（会返回一个完整的一周）
export function getDatesByWeek(semesterStart: string, currentWeek: number): string[] {
  const firstDayOfWeek = dayjs(getFirstDateByWeek(semesterStart, currentWeek));

  return Array.from({ length: 7 }, (_, i) => {
    return firstDayOfWeek.add(i, 'day').format('YYYY-MM-DD'); // 返回日期字符串格式 YYYY-MM-DD
  });
}

// 根据学期开始日期和结束日期计算一学期一共有多少周
export function getWeeksBySemester(semesterStart: string, semesterEnd: string): number {
  const startDate = dayjs(semesterStart);
  const endDate = dayjs(semesterEnd);
  const diffDays = endDate.diff(startDate, 'day');

  return Math.ceil(diffDays / 7);
}

// （研究生）将研究生学期和本科生学期进行转换
// e.g. 2023-2024-1 => 202301
export function convertSemester(semester: string): string {
  console.log('Converting semester:', semester);
  // 先判断格式是否符合 202401，如果是的话则不做任何转化直接返回
  if (/^\d{6}$/.test(semester)) {
    return semester;
  }
  const [startYear, , term] = semester.split('-'); // 只需要起始年份和学期
  const formattedTerm = term.padStart(2, '0'); // 将学期转换为两位数
  return `${startYear}${formattedTerm}`;
}

// （研究生）将本科生学期转化为研究生学期
// e.g. 202401 => 2023-2024-1
export function deConvertSemester(semester: string): string {
  console.log('De-converting semester:', semester);
  const year = semester.slice(0, 4); // 提取前四位作为起始年份
  const term = semester.slice(4); // 提取后两位作为学期编号
  const endYear = (Number(year) + 1).toString(); // 计算结束年份
  return `${year}-${endYear}-${Number(term)}`; // 拼接成 startYear-endYear-term 的格式
}
