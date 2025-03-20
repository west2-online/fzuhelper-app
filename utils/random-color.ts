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

const examColor = '#FF6347'; // 考试的颜色

/**
 * 返回考试的颜色
 * @returns 考试的颜色
 */
export const getExamColor = (): string => examColor;

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
