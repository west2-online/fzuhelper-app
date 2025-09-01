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
  if (score === '优秀' || score === '优') {
    return GRADE_COLOR_EXCELLENT; // 优秀
  } else if (score === '良好' || score === '良') {
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
  // 五级制和两级制转换为数值进行比较，优和良是研究生院的成绩
  if (score === '优秀' || score === '优') return 89.9;
  if (score === '合格') return 89.89;
  if (score === '良好' || score === '良') return 79.9;
  if (score === '中等') return 69.9;
  if (score === '及格') return 59.9;
  if (score === '不及格' || score === '不合格') return -1;
  return -2; // 其他情况，按最低分处理
};

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
  '任意选修课', // 部分学院的错误统计方式，但考虑到分数修正需要保留
];

// 移除补考课程对应的原课程
const removeReexaminationCourse = (data: CourseGradesData[]) =>
  data.filter(item => {
    if (item.exam_type.includes('补考')) { // 当前课程是补考课程
      return item.gpa !== ''; // 保留出了成绩的补考课程
    }

    // 找到对应的补考课程
    const nItem = data.find(
      // 理论上一个学期内不会有两门同名的同教师授课课程，所以只需要判断名称和教师是否相同
      o => o.name === item.name && o.teacher === item.teacher && o.exam_type.includes('补考'),
    );

    return (
      !nItem || // 没有找到补考课程
      (nItem.exam_type.includes('补考') && !nItem.gpa) // 找到补考课程但补考课程没有出成绩
    );
  });

// 获取 GPA 相关数据
const getGpaRelevantData = (data: CourseGradesData[]) =>
  data
    // 过滤掉不需要的课程类型
    .filter(item => !excludedElectiveTypes.includes(item.elective_type))
    // 过滤掉二专业课程
    .filter(item => !item.elective_type.includes('二专业'))
    // GPA 不为空
    .filter(item => item.gpa)
    // 根据《福州大学本科生课程考核与成绩记载管理实施办法（暂行）》中第四条（二）第一款：
    // > 考核成绩采用两级制的，暂不计算绩点。
    // https://jwch.fzu.edu.cn/info/1172/13460.htm
    .filter(item => item.score !== '合格' && item.score !== '不合格');

// 计算单个学期的总体数据
// 过滤对应学期数据的逻辑在上层已经写了，所以这里无需再次过滤
export const calSingleTermSummary = (data: CourseGradesData[]) => {
  const filteredData = removeReexaminationCourse(data);
  const gpaRelevantData = getGpaRelevantData(filteredData);

  console.log(filteredData);

  // 本学期总课程数
  const totalCount = filteredData.length;
  // 本学期总修学分
  const totalCredit = filteredData.reduce((sum, item) => sum + parseFloat(item.credit || '0'), 0);
  // 单科最高分
  const maxScore = Math.max(...filteredData.map(item => parseFloat(item.score || '0') || 0));

  // === 计算平均学分绩 (GPA) ===
  // 单门课程学分绩点乘积之和除以总学分

  // 分子：学分绩点乘积之和
  const totalWeightedGPA = gpaRelevantData.reduce((sum, item) => {
    const credit = parseFloat(item.credit || '0');
    const gpa = parseFloat(item.gpa || '0');
    return sum + credit * gpa; // 累加单科学分 * 绩点
  }, 0);

  // 分母：总学分
  const totalGpaCredits = gpaRelevantData.reduce((sum, item) => sum + parseFloat(item.credit || '0'), 0);

  return {
    totalCount,
    totalCredit,
    maxScore,
    GPA: totalGpaCredits > 0 ? totalWeightedGPA / totalGpaCredits : 0, // 平均绩点
  };
};
