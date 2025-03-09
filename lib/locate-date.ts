import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch } from 'expo/fetch';

import type { LocateDateResult } from '@/api/interface';
import { JWCH_LOCATE_DATE_CACHE_KEY, JWCH_LOCATE_DATE_URL } from '@/lib/constants';
import { JWCHLocateDateResult } from '@/types/data';

/*
这里附上这个 URL 请求的返回内容（文本，这个注释也是它直接返回的，挺幽默）：
var week = "23"; //定义当前第几周
var xn = "2024";  //定义当前学年
var xq = "01";  //定义当前学期
*/
export async function fetchJwchLocateDate(): Promise<JWCHLocateDateResult> {
  const data = await fetch(JWCH_LOCATE_DATE_URL).then(res => res.text());

  // 使用正则表达式解析返回内容
  const match = data.match(/var week = "(\d+)";\s*\/\/.*\s*var xn = "(\d{4})";\s*\/\/.*\s*var xq = "(\d{2})";/);
  if (!match) {
    throw new Error('Failed to parse response from JWCH_LOCATE_DATE_URL');
  }

  // 提取 week, year, term，并转换为数字
  const [week, year, term] = match.slice(1).map(Number);

  return { week, year, term };
}

// 基于教务处的数据定位今天是第几周，以及今天的日期
// 返回一个对象，包含 date（当前日期）、week（当前周数）、day（当前星期几）、semester（当前学期，格式样例：202401）
// e.g. { date: '2024-06-01', week: 23, day: 3, semester: '202401' }
// 这个函数应当只会在课表业务中涉及
// 使用了本地缓存，但是缓存逻辑和 PersistentQuery 不同，我们只在跨周时重新获取数据
export default async function locateDate(): Promise<LocateDateResult> {
  // 获取当前日期
  const currentDate = new Date();
  const currentDay = currentDate.getDay() === 0 ? 7 : currentDate.getDay(); // 1 表示周一，7 表示周日
  const formattedCurrentDate = currentDate.toISOString().split('T')[0]; // 格式化日期为 YYYY-MM-DD

  // 尝试读取缓存
  try {
    const cachedData = await AsyncStorage.getItem(JWCH_LOCATE_DATE_CACHE_KEY);

    if (cachedData) {
      const { date: cachedDate, week, year, term } = JSON.parse(cachedData);

      // 判断是否跨周
      const cachedDateObj = new Date(cachedDate);
      const cachedDay = cachedDateObj.getDay() === 0 ? 7 : cachedDateObj.getDay();

      // 如果缓存日期是同一周的，直接返回缓存数据
      if (currentDay >= cachedDay && currentDate.getTime() - cachedDateObj.getTime() < 7 * 24 * 60 * 60 * 1000) {
        const semester = `${year}${term.toString().padStart(2, '0')}`;
        console.log('Using cached locate date:', { date: formattedCurrentDate, week, day: currentDay, semester });
        return { date: formattedCurrentDate, week, day: currentDay, semester };
      }
    }
  } catch (error) {
    console.warn('Failed to read cache:', error);
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
  const startDate = new Date(semesterStart);
  const startDayOfWeek = (startDate.getDay() + 6) % 7; // 将星期日（0）转换为 6，其他天数减 1 对应星期一到星期六
  const adjustedStartDate = new Date(startDate);

  // 如果学期开始日期不是星期一，则调整到最近的星期一
  adjustedStartDate.setDate(startDate.getDate() - startDayOfWeek);

  const firstDayOfWeek = new Date(adjustedStartDate);
  firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (currentWeek - 1) * 7);

  return firstDayOfWeek.toISOString().split('T')[0]; // 返回日期字符串格式 YYYY-MM-DD
}

// 根据学期开始日期和当前周数获取当前周的日期（会返回一个完整的一周）
export function getDatesByWeek(semesterStart: string, currentWeek: number): string[] {
  const firstDayOfWeek = new Date(getFirstDateByWeek(semesterStart, currentWeek));
  firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (currentWeek - 1) * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(firstDayOfWeek);
    date.setDate(firstDayOfWeek.getDate() + i);
    return date.toISOString().split('T')[0]; // 返回日期字符串格式 YYYY-MM-DD
  });
}

// 根据学期开始日期和结束日期计算一学期一共有多少周
export function getWeeksBySemester(semesterStart: string, semesterEnd: string): number {
  const startDate = new Date(semesterStart);
  const endDate = new Date(semesterEnd);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
