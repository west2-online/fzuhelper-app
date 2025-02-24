import type { LocateDateResult } from '@/api/interface';
import { JWCH_LOCATE_DATE_CACHE_KEY, JWCH_LOCATE_DATE_URL } from '@/lib/constants';
import { get } from '@/modules/native-request';
import { JWCHLocateDateResult } from '@/types/data';
import AsyncStorage from '@react-native-async-storage/async-storage';

/*
这里附上这个 URL 请求的返回内容（文本，这个注释也是它直接返回的，挺幽默）：
var week = "23"; //定义当前第几周
var xn = "2024";  //定义当前学年
var xq = "01";  //定义当前学期
*/
export async function fetchJwchLocateDate(): Promise<JWCHLocateDateResult> {
  const response = await get(JWCH_LOCATE_DATE_URL, { responseType: 'text' });

  // 确保 data 是字符串
  const data = typeof response.data === 'string' ? response.data : new TextDecoder('utf-8').decode(response.data);

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
