import { COURSE_SYMBOLS_MAP } from '@/lib/constants';

const SYMBOLS = Object.keys(COURSE_SYMBOLS_MAP);
const SYMBOLS_REGEX = new RegExp(`[${SYMBOLS.join('')}]`, 'g');

/**
 * Format course name by replacing special symbols with their text equivalents
 * @param name - Course name that may contain special symbols like ▲, ●, ★
 * @returns Formatted course name with symbols replaced by text (e.g., [补考], [重修], [二专业])
 */
export const formatCourseName = (name: string): string => {
  return name
    .replace(SYMBOLS_REGEX, symbol =>
      symbol in COURSE_SYMBOLS_MAP ? COURSE_SYMBOLS_MAP[symbol as keyof typeof COURSE_SYMBOLS_MAP] : symbol,
    )
    .trim();
};
