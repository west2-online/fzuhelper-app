import { DATE_FORMAT } from '@/lib/constants';
import dayjs from 'dayjs';

/**
 * Format a date to string using dayjs
 * @param date - Date object to format, if undefined returns undefined
 * @param format - Format string (default: DATE_FORMAT from constants)
 * @returns Formatted date string or undefined
 */
export const formatDate = (date?: Date, format: string = DATE_FORMAT): string | undefined => {
  return date ? dayjs(date).format(format) : undefined;
};

/**
 * Format a timestamp to YYYY-MM-DD format
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string in YYYY-MM-DD format
 */
export const formatTimestampToDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
};
