import type { JwchClassroomExamResponse as ExamData } from '@/api/backend';
import type { MergedExamData } from '@/types/academic';
import { LocalUser, USER_TYPE_POSTGRADUATE } from './user';

// 将日期字符串(xxxx年xx月xx日)转换为 Date 对象，如转换失败返回 undefined
const parseDate = (dateStr: string): Date | undefined => {
  // 研究生的考试日期格式是 2023-12-9 这样的，可以直接转换
  if (LocalUser.getUser().type === USER_TYPE_POSTGRADUATE) {
    if (dateStr === '') return undefined; // 如果没有还是返回 undefined
    return new Date(dateStr);
  }
  const match = dateStr.match(/(\d{4})年(\d{2})月(\d{2})日/);
  return match ? new Date(`${match[1]}-${match[2]}-${match[3]}`) : undefined;
};

// 格式化考试数据
export const formatExamData = (examData: ExamData): MergedExamData[] => {
  const now = new Date();

  return examData
    .map(exam => ({
      name: exam.name,
      credit: exam.credit || '0',
      teacher: exam.teacher || '',
      date: parseDate(exam.date),
      location: exam.location || undefined,
      time: exam.time || undefined,
      isFinished: exam.date ? now > parseDate(exam.date)! : false,
    }))
    .sort((a, b) => {
      // 按照日期排序，未知日期的排在最后
      if (a.date && b.date) return b.date.getTime() - a.date.getTime();
      return a.date ? -1 : 1;
    });
};
