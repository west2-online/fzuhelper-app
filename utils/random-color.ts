// 由于随机颜色太丑陋了，我们使用了固定颜色
export const nonCurrentWeekCourses = '#DDDDDF'; // 非本周课程的颜色
const courseColors = [
  // '#FFF39F9D',
  // '#FF9FA5D5',
  // '#FF83B6B1',
  // '#FFFDC683',
  // '#FFEB90B1',
  // '#FF92C5F2',
  // '#FFA4D1A6',
  // '#7Cffb300',
  // '#7C8e24aa',
  // '#7C00acc1',
  // '#7C7cb342',
  // '#7C6D5041',
  // '#7C5e35b1',
  // '#7Cc0ca33',
  // '#7C6d4c41',
  // '#7C311b92',
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
];

const examColor = '#FF6347'; // 考试的颜色

let availableColors = [...courseColors]; // 可用颜色数组
const courseColorMap: Map<string, string> = new Map(); // 存储 courseName 和颜色的对应关系

/**
 * 返回考试的颜色
 * @returns 考试的颜色
 */
export const getExamColor = (): string => examColor;

/**
 * 为课程生成浅色主题下的随机颜色
 * @param courseName 课程名称
 * @returns 分配的颜色
 */
const generateRandomColor = (courseName: string): string => {
  // 如果已经为这个 courseName 分配了颜色，直接返回
  if (courseColorMap.has(courseName)) {
    return courseColorMap.get(courseName)!;
  }

  // 如果没有可用颜色，返回默认颜色
  if (availableColors.length === 0) {
    console.warn('所有颜色都已选择，无法生成新颜色。');
    return '#000000'; // 返回默认颜色或处理逻辑
  }

  // 随机选择一个颜色
  const randomIndex = Math.floor(Math.random() * availableColors.length);
  const color = availableColors[randomIndex];

  // 从可用颜色数组中移除已选择的颜色
  availableColors.splice(randomIndex, 1);

  // 将新颜色与 courseName 的关系存储到映射中
  courseColorMap.set(courseName, color);

  console.log(`Generated color for course "${courseName}":`, color);

  return color;
};

/**
 * 根据颜色模式获取课程颜色
 */
export const getCourseColor = (color: string, darkmode: boolean): string => {
  // 深色主题下，对颜色进行按位与 0xC0FFFFFF 的处理，使颜色变得更加柔和
  let processedColor = color;
  if (darkmode) {
    // eslint-disable-next-line no-bitwise
    processedColor = `#${(parseInt(color.slice(1), 16) & 0xc0ffffff).toString(16).padStart(6, '0').toUpperCase()}`;
  }
  return processedColor;
};

/**
 * 清空颜色索引和映射
 */
export const clearColorMapping = () => {
  console.log('Clearing color index and resetting mappings');
  availableColors = [...courseColors]; // 重置可用颜色数组
  courseColorMap.clear(); // 清空 courseName 和颜色的映射
};

export default generateRandomColor;
