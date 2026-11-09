import { getCourseColors, normalizeCourseColorScheme, type CourseColorScheme } from '@/lib/course-color-schemes';
import { getCourseDisplayColor, type CourseColorDisplayOptions } from '@/utils/course-color-display';

export { getCourseColors, normalizeCourseColorScheme, type CourseColorScheme } from '@/lib/course-color-schemes';

export const nonCurrentWeekCourseColor = '#DEDEDE'; // 非本周课程的颜色

const examColor = '#FF6347'; // 考试的颜色

interface CourseColorAllocation {
  colorMap: Map<string, string>;
  availableColors: string[];
}

// 每个学号、配色方案对应独立的颜色映射，切换方案不会复用旧方案的颜色。
const studentColorAllocations = new Map<string, Map<CourseColorScheme, CourseColorAllocation>>();

/**
 * 获取指定学号和配色方案的分配状态，不存在则创建。
 */
const getAllocationForStudent = (studentId: string, scheme: CourseColorScheme): CourseColorAllocation => {
  const normalizedScheme = normalizeCourseColorScheme(scheme);
  let allocations = studentColorAllocations.get(studentId);
  if (!allocations) {
    allocations = new Map();
    studentColorAllocations.set(studentId, allocations);
  }

  let allocation = allocations.get(normalizedScheme);
  if (!allocation) {
    allocation = { colorMap: new Map(), availableColors: [...getCourseColors(normalizedScheme)] };
    allocations.set(normalizedScheme, allocation);
  }
  return allocation;
};

/**
 * 返回考试的颜色
 * @returns 考试的颜色
 */
export const getExamColor = (): string => examColor;

/**
 * 依据课程key 获取颜色
 * @param courseName 课程名称
 * @param studentId 学号，用于区分不同学生的颜色映射
 * @param scheme 课表配色方案
 */
export const allocateColorForCourse = (
  courseName: string,
  studentId: string,
  scheme: CourseColorScheme = 'old',
): string => {
  const { colorMap, availableColors } = getAllocationForStudent(studentId, scheme);

  // 如果已经为这个 courseName 分配了颜色，直接返回
  if (colorMap.has(courseName)) {
    return colorMap.get(courseName)!;
  }

  // 方案颜色用完后重新开始一轮；已分配课程仍保留原色，少量颜色也可以覆盖完整课表。
  if (availableColors.length === 0) {
    availableColors.push(...getCourseColors(scheme));
  }

  // 随机选择一个颜色
  const randomIndex = Math.floor(Math.random() * availableColors.length);
  const color = availableColors[randomIndex];

  // 从可用颜色数组中移除已选择的颜色
  availableColors.splice(randomIndex, 1);

  // 将新颜色与 courseName 的关系存储到映射中
  colorMap.set(courseName, color);

  console.log(`为学号 "${studentId}" 的课程 "${courseName}" 分配颜色:`, color);

  return color;
};

/**
 * 清空指定学号的颜色索引和映射
 * @param studentId 学号，用于区分不同学生的颜色映射
 */
export const clearColorMapping = (studentId: string, scheme: CourseColorScheme = 'old') => {
  console.log(`Clearing color index and resetting mappings for student: ${studentId}`);
  const allocation = getAllocationForStudent(studentId, scheme);
  allocation.availableColors = [...getCourseColors(scheme)];
  allocation.colorMap.clear();
};

/**
 * 仅在绘制时生成主题配色，不改变课程原色、颜色分配或缓存。
 */
export const getCourseColor = (color: string, darkmode: boolean, options: CourseColorDisplayOptions = {}): string =>
  getCourseDisplayColor(color, darkmode, {
    ...options,
    // 非本周课程保持弱化的中性灰色，也使用统一的 75% 背景不透明度。
    compensate: options.compensate !== false && color.toUpperCase() !== nonCurrentWeekCourseColor,
  });

export const getTextColor = (bgColor: string, darkmode: boolean): string => {
  if (bgColor === nonCurrentWeekCourseColor) return '#00000033';
  return darkmode ? '#FFFFFFDE' : '#FFFFFF';
};
