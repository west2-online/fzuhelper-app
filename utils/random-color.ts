// 生成随机颜色的辅助函数
const generateRandomColor = (seed: string): string => {
  let hash = 0;

  // 引入字符位置权重的哈希计算
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) * (i + 1) + ((hash << 5) - hash);
  }

  // 添加扰动因子
  const disturbance = Math.sin(hash) * 10000; // 使用正弦函数扰动
  hash = Math.abs(hash + disturbance);

  // 增强颜色差异化，通过引入额外的扰动因子
  const h = Math.abs(hash % 360); // 色相 (Hue)
  const s = 70 + (Math.abs(hash) % 30); // 饱和度 (Saturation) 在 70% 到 100% 之间
  const l = 75 + (Math.abs(hash) % 10); // 亮度 (Lightness) 在 80% 到 90% 之间

  return `hsl(${h}, ${s}%, ${l}%)`;
};

export default generateRandomColor;
