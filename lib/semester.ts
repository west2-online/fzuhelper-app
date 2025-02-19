// 处理显示名称，示例：
// 202401 -> 2024年秋季
// 202402 -> 2025年春季
export const formatSemesterDisplayText = (semester: string) => {
  // 额外判断一下长度，防止出现异常
  if (semester.length !== 6) {
    return '未知学期 (' + semester + ')';
  }

  const year = parseInt(semester.slice(0, 4), 10);
  const term = semester.slice(4);

  return `${year + (term === '01' ? 0 : 1)}年${term === '01' ? '秋季' : '春季'}`;
};
