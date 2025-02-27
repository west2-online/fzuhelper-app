import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { CLASS_SCHEDULES } from '@/lib/constants';
import { SCHEDULE_MIN_HEIGHT } from '@/lib/course';
import { cn } from '@/lib/utils';

// 判断当前时间是否在指定时间段内
const isTimeInRange = (currentTime: string, startTime: string, endTime: string): boolean => {
  const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
};

// 获取当前时间的字符串格式（HH:mm）
const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};

interface TimeColProps {
  height: number;
}

// 课程表的左侧时间段列
const TimeCol: React.FC<TimeColProps> = ({ height }) => {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  const displayHeight = useMemo(() => Math.max(SCHEDULE_MIN_HEIGHT, height) / 11, [height]);

  // 定时更新当前时间
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 30000); // 每半分钟更新一次

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="flex w-[32px] flex-shrink-0 flex-grow-0 basis-[32px] flex-col bg-background">
      {CLASS_SCHEDULES.map((time, index) => {
        const isActive = isTimeInRange(currentTime, time[0], time[1]);

        return (
          <View
            key={index}
            className={cn(
              'flex w-[32px] flex-grow flex-col items-center justify-center overflow-hidden py-1',
              isActive && 'border border-primary',
            )}
            style={{ height: displayHeight }}
          >
            <Text
              className={cn('text-[12px] font-bold', isActive ? 'text-primary' : 'text-text-secondary')}
              numberOfLines={1}
            >
              {index + 1}
            </Text>
            <Text className={cn('text-[8px]', isActive ? 'text-primary' : 'text-text-secondary')} numberOfLines={1}>
              {time[0]}
            </Text>
            <Text
              className={cn('overflow-clip text-[8px]', isActive ? 'text-primary' : 'text-text-secondary')}
              numberOfLines={1}
            >
              {time[1]}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default TimeCol;
