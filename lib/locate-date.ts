import type { LocateDateResult } from '@/api/interface';
import { JWCH_LOCATE_DATE_URL } from '@/lib/constants';
import { get } from '@/modules/native-request';
import { JWCHLocateDateResult } from '@/types/data';

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
export default async function locateDate(): Promise<LocateDateResult> {
  // 先获取教务处定位数据
  const { week, year, term } = await fetchJwchLocateDate();

  // 获取当前日期
  const date = new Date();
  // 提取星期几（1 表示周一，7 表示周日）
  const day = date.getDay() === 0 ? 7 : date.getDay();
  // 拼接学期信息
  const semester = `${year}${term.toString().padStart(2, '0')}`;
  // 格式化日期为 YYYY-MM-DD
  const formattedDate = date.toISOString().split('T')[0];

  return { date: formattedDate, week, day, semester };
}
