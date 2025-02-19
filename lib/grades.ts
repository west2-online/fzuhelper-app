import { CourseGradesData } from '@/types/grades';
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
  // 计算单科最低分
  const minScore = Math.min(...filteredData.map(item => parseFloat(item.score) || 0));
  // 计算平均学分绩(GPA)，单门课程学分绩点乘积之和除以总学分
  const gpa = filteredData.reduce((sum, item) => sum + (parseFloat(item.gpa) || 0) * parseFloat(item.credit), 0);

  return {
    totalCount,
    totalCredit,
    maxScore,
    minScore,
    GPA: filteredData.length > 0 ? gpa / filteredData.length : 0, // 平均绩点
  };
};
