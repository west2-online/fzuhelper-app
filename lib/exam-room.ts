import type { JwchClassroomExamResponse as ExamData } from '@/types/backend';
import type { MergedExamData } from '@/types/academic';
import { LocalUser, USER_TYPE_POSTGRADUATE } from './user';
import dayjs from 'dayjs';

// 将日期字符串(xxxx年xx月xx日)转换为 Date 对象，如转换失败返回 undefined
const parseDate = (dateStr: string): dayjs.Dayjs | undefined => {
  // 研究生的考试日期格式是 2023-12-9 这样的，可以直接转换
  if (LocalUser.getUser().type === USER_TYPE_POSTGRADUATE) {
    if (dateStr === '') return undefined; // 如果没有还是返回 undefined
    const parsedDate = dayjs(dateStr);
    return parsedDate.isValid() ? parsedDate : undefined;
  }
  // 本科生的日期格式是 xxxx年xx月xx日，需要先用正则解析
  const match = dateStr.match(/(\d{4})年(\d{2})月(\d{2})日/);
  if (match) {
    const formattedDate = `${match[1]}-${match[2]}-${match[3]}`;
    const parsedDate = dayjs(formattedDate);
    return parsedDate.isValid() ? parsedDate : undefined;
  }

  return undefined; // 如果解析失败，返回 undefined
};

// 格式化考试数据
export const formatExamData = (examData: ExamData): MergedExamData[] => {
  const now = dayjs(); // 使用 dayjs 获取当前时间

  return examData
    .map(exam => {
      const examDate = parseDate(exam.date); // 使用 parseDate 解析日期
      return {
        name: exam.name,
        credit: exam.credit || '0',
        teacher: exam.teacher || '',
        date: examDate,
        location: exam.location || undefined,
        time: exam.time || undefined,
        isFinished: examDate ? now.isAfter(examDate) : false, // 使用 dayjs 的 isAfter 方法比较日期
      };
    })
    .sort((a, b) => {
      // 按照日期排序，未知日期的排在最后
      if (a.date && b.date) return a.date.isBefore(b.date) ? -1 : 1;
      return a.date ? -1 : 1;
    });
};
