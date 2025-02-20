import { CourseGradesData } from '@/types/academic';
import {
  GRADE_COLOR_EXCELLENT,
  GRADE_COLOR_FAIL,
  GRADE_COLOR_GOOD,
  GRADE_COLOR_MEDIUM,
  GRADE_COLOR_PASS,
  GRADE_COLOR_UNKNOWN,
} from './constants';

// 这个函数负责将成绩转换为颜色，需要考虑的实现比较多，独立出函数来设计
export const parseScoreToColor = (score: string) => {
  // 没有录入成绩
  if (score === '成绩尚未录入') {
    return GRADE_COLOR_UNKNOWN;
  }

  // 数字成绩
  const numericScore = parseFloat(score);
  if (!isNaN(numericScore)) {
    // 判断分数区间并返回对应颜色
    if (numericScore >= 90) {
      return GRADE_COLOR_EXCELLENT; // 优秀
    } else if (numericScore >= 80) {
      return GRADE_COLOR_GOOD; // 良好
    } else if (numericScore >= 70) {
      return GRADE_COLOR_MEDIUM; // 中等
    } else if (numericScore >= 60) {
      return GRADE_COLOR_PASS; // 及格
    } else {
      return GRADE_COLOR_FAIL; // 不及格
    }
  }

  // 五级制成绩
  if (score === '优秀') {
    return GRADE_COLOR_EXCELLENT; // 优秀
  } else if (score === '良好') {
    return GRADE_COLOR_GOOD; // 良好
  } else if (score === '中等') {
    return GRADE_COLOR_MEDIUM; // 中等
  } else if (score === '及格') {
    return GRADE_COLOR_PASS; // 及格
  } else if (score === '不及格') {
    return GRADE_COLOR_FAIL; // 不及格
  }

  // 两级制
  if (score === '合格') {
    return GRADE_COLOR_EXCELLENT; // 合格
  } else if (score === '不合格') {
    return GRADE_COLOR_FAIL; // 不合格
  }

  // 缺考
  if (score === '缺考') {
    return GRADE_COLOR_UNKNOWN; // 缺考
  }

  return GRADE_COLOR_UNKNOWN; // 其他情况
};

// 将成绩转换为数值以进行比较
export const parseScore = (score: string) => {
  const numericScore = parseFloat(score);
  if (!isNaN(numericScore)) {
    return numericScore;
  }
  // 五级制和两级制转换为数值进行比较
  if (score === '优秀') return 89.9;
  if (score === '合格') return 89.89;
  if (score === '良好') return 79.9;
  if (score === '中等') return 69.9;
  if (score === '及格') return 59.9;
  if (score === '不及格' || score === '不合格') return -1;
  return -2; // 其他情况，按最低分处理
};

// 计算单个学期的总体数据
export const calSingleTermSummary = (data: CourseGradesData[], term: string) => {
  const filteredData = data.filter(item => item.term === term);

  // 计算本学期总课程数
  const totalCount = filteredData.length;
  // 计算本学期总修学分
  const totalCredit = filteredData.reduce((sum, item) => sum + parseFloat(item.credit || '0'), 0);
  // 计算单科最高分
  const maxScore = Math.max(...filteredData.map(item => parseFloat(item.score) || 0));

  // 计算平均学分绩(GPA)，单门课程学分绩点乘积之和除以总学分，计算比较复杂

  // 需要排除的课程类型
  const excludedElectiveTypes = [
    '自然科学与工程技术类',
    '人文社会科学类',
    '经济管理类',
    '文学与艺术类',
    '工程技术类',
    '劳动教育类',
    '创新创业类',
    '通识选修任选',
    '任意选修', // 转专业会遇到
  ];

  // 进一步过滤出需要计算的数据
  const gpaRelevantData = filteredData.filter(
    item =>
      !excludedElectiveTypes.includes(item.elective_type) && // 排除特定课程类型
      !item.elective_type.includes('二专业') && // 排除课程类型中包含“二专业”的课程
      item.gpa && // gpa 不为空
      item.score !== '合格' &&
      item.score !== '不合格', // 成绩不是“合格”或“不合格”的课程不参与绩点统计，即使他们绩点显示为 1.0
  );

  // 计算 GPA，单科学分绩点乘积之和除以总学分
  const totalWeightedGPA = gpaRelevantData.reduce((sum, item) => {
    const credit = parseFloat(item.credit || '0');
    const gpa = parseFloat(item.gpa || '0');
    return sum + credit * gpa; // 累加单科学分 * 绩点
  }, 0);

  const totalGpaCredits = gpaRelevantData.reduce((sum, item) => sum + parseFloat(item.credit || '0'), 0);

  return {
    totalCount,
    totalCredit,
    maxScore,
    GPA: totalGpaCredits > 0 ? totalWeightedGPA / totalGpaCredits : 0, // 平均绩点
  };
};
