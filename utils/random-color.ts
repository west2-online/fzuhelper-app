import { COURSE_COLOR_COUNT } from '@/lib/palettes';

export const examColor = '#FF6347'; // 考试的颜色

// 同一张课表内，按课名分配色号，每轮用完色板再重复取色。
export const createCourseColorAllocator = () => {
  const colorIndices = new Map<string, number>();
  const available: number[] = [];

  return (name: string): number => {
    const existing = colorIndices.get(name);
    if (existing !== undefined) return existing;

    if (available.length === 0) {
      for (let index = 0; index < COURSE_COLOR_COUNT; index++) available.push(index);
    }

    const [index] = available.splice(Math.floor(Math.random() * available.length), 1);
    colorIndices.set(name, index);
    return index;
  };
};
