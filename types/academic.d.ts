import dayjs from 'dayjs';

// 课程成绩数据
export interface CourseGradesData {
  name: string; // 课程名
  teacher: string; // 授课教师
  credit: string; // 学分（有 0 学分的课）
  score: string; // 成绩（没有录入成绩会显示‘成绩尚未录入’，5 级制和两级制度会显示中文）
  gpa: string; // 绩点（注意这个可能是空的）
  term: string; // 学期(e.g. 202402)
  exam_type: string; // 考试类型(e.g. 正常考考试、第1次重修、正常考考试补考)
  elective_type: string; // 选修类型(e.g. 通识必修、实践必修、毕业实习、学科必修、专业选修、人文社会科学类)
}

// 学期总结
export interface SemesterSummary {
  totalCredit: number; // 本学期总修学分
  totalCount: number; // 本学期总课程数
  maxScore: number; // 单科最高分
  GPA: number; // GPA
}

// 考场数据
export interface MergedExamData {
  name: string; // 课程名
  credit: string; // 学分
  teacher: string; // 授课教师
  date?: dayjs; // 考试日期
  location?: string; // 考场位置
  time?: string; // 考试时间
  isFinished: boolean; // 是否已经结束
}
