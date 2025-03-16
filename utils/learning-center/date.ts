import dayjs from 'dayjs';

// 判断时间是否已过
export const isTimePast = (date: Date, timeStr: string): boolean => {
  const isToday = formatDate(date, 'YYYY-MM-DD') === formatDate(new Date(), 'YYYY-MM-DD');

  if (!isToday) return false;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const [hour, minute] = timeStr.split(':').map(Number);

  if (currentHour > hour) return true;
  if (currentHour === hour && currentMinute >= minute) return true;

  return false;
};

// 格式化日期
export const formatDate = (date: Date, formatStr: string): string => {
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const dayjsDate = dayjs(date);

  // 如果格式字符串中包含自定义的 "EEE"（周几），需要特殊处理
  if (formatStr === 'EEE') {
    const weekDay = weekDays[dayjsDate.day()];
    return `周${weekDay}`;
  }

  // 使用 dayjs 的格式化功能处理其他格式
  return dayjsDate.format(formatStr);
};

// 计算两个时间之间的小时差
export const calculateHoursDifference = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // 计算分钟差，然后转换为小时
  return (endMinutes - startMinutes) / 60;
};

// 添加指定小时到当前日期
export const addHours = (date: Date, hours: number): Date => {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
};
