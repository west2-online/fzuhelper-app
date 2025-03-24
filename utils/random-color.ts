export const nonCurrentWeekCourseColor = '#DEDEDE'; // 非本周课程的颜色
export const courseColors = [
  '#7A6068',
  '#8D5270',
  '#5A9DBD',
  '#307D81',
  '#B99799',
  '#AA9CC6',
  '#A2CAE7',
  '#619AA0',
  '#D8B4BB',
  '#E5B9D3',
  '#5BB3DD',
  '#94C096',
  '#D07A88',
  '#F0C4A9',
  '#92BAC5',
  '#9AD1CD',
  '#F39E9D',
  '#E0B092',
  '#7D89AB',
  '#BBD5B4',
  '#C6A5B6',
  '#87B9C1',
  '#E3A8A1',
  '#A5C7A6',
  '#D4B8CE',
];

const defaultColor = '#000000'; // 默认颜色(全黑)
const examColor = '#FF6347'; // 考试的颜色
const courseColorMap: Map<string, string> = new Map(); // 存储 courseName 和颜色的对
// 应关系
let availableColors = [...courseColors]; // 可用颜色数组

/**
 * 返回考试的颜色
 * @returns 考试的颜色
 */
export const getExamColor = (): string => examColor;

/**
 * 依据课程key 获取颜色
 * @param course 课程信息
 */
export const allocateColorForCourse = (courseName: string): string => {
  // 如果已经为这个 courseName 分配了颜色，直接返回
  if (courseColorMap.has(courseName)) {
    return courseColorMap.get(courseName)!;
  }

  // 如果没有可用颜色，返回默认颜色
  if (availableColors.length === 0) {
    console.warn('所有颜色都已选择，无法生成新颜色。');
    return defaultColor; // 返回默认颜色或处理逻辑
  }

  // 随机选择一个颜色
  const randomIndex = Math.floor(Math.random() * availableColors.length);
  const color = availableColors[randomIndex];

  // 从可用颜色数组中移除已选择的颜色
  availableColors.splice(randomIndex, 1);

  // 将新颜色与 courseName 的关系存储到映射中
  courseColorMap.set(courseName, color);

  console.log(`为课程 "${courseName}" 分配颜色:`, color);

  return color;
};

/**
 * 清空颜色索引和映射
 */
export const clearColorMapping = () => {
  console.log('Clearing color index and resetting mappings');
  availableColors = [...courseColors]; // 重置可用颜色数组
  courseColorMap.clear(); // 清空 courseName 和颜色的映射
};

/**
 * 根据颜色模式获取课程颜色
 */
export const getCourseColor = (color: string, darkmode: boolean): string => {
  // 深色主题下，对颜色增加透明度，使颜色变得更加柔和
  let processedColor = color;
  // 非本周颜色单独处理
  if (color === nonCurrentWeekCourseColor && darkmode) return '#DEDEDEDE';
  if (darkmode) {
    if (color.length === 7) {
      // 6 位颜色 (#RRGGBB) → 变成 #RRGGBBC0（加上 75% 透明度）
      processedColor += 'C0';
    }
  }
  // console.log('color', color, processedColor);
  return processedColor;
};

export const getTextColor = (bgColor: string, darkmode: boolean): string => {
  if (bgColor === nonCurrentWeekCourseColor) return '#00000033';
  return darkmode ? '#FFFFFFDE' : '#FFFFFF';
};
