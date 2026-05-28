import dayjs from 'dayjs';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, type TextLayoutEvent, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { CLASS_SCHEDULES, TIME_FORMAT } from '@/lib/constants';
import { SCHEDULE_ITEM_MIN_HEIGHT } from '@/lib/course';
import { cn } from '@/lib/utils';

const CONTAINER_WIDTH = 32;
const TEXT_OVERFLOW_THRESHOLD = CONTAINER_WIDTH - 4;

const styles = StyleSheet.create({
  robotoFont: {
    fontFamily: 'Roboto-Regular',
  },
});

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
  return dayjs().format(TIME_FORMAT);
};

interface TimeColProps {
  height: number;
  minItemHeight?: number;
}

// 定义字号级别
const FONT_SIZE_LEVELS = {
  title: [12, 11, 10, 9, 8],
  time: [8, 7, 6, 5, 4],
};
const LINE_HEIGHT_RATIO = {
  title: 1.2,
  time: 1.1,
};

// 课程表的左侧时间段列
const TimeCol: React.FC<TimeColProps> = ({ height, minItemHeight = SCHEDULE_ITEM_MIN_HEIGHT }) => {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [titleFontSizeLevel, setTitleFontSizeLevel] = useState(0);
  const [timeFontSizeLevel, setTimeFontSizeLevel] = useState(0);

  const displayHeight = useMemo(() => Math.max(minItemHeight, Math.floor(height / 11)), [height, minItemHeight]);

  // 处理标题文本布局，逐步减小字号
  const handleTitleTextLayout = useCallback(
    (event: TextLayoutEvent) => {
      if (titleFontSizeLevel >= FONT_SIZE_LEVELS.title.length - 1) return;
      const textWidth = event.nativeEvent.lines[0]?.width ?? 0;
      // 检测文本是否会被截断
      if (textWidth > TEXT_OVERFLOW_THRESHOLD) {
        setTitleFontSizeLevel(prev => prev + 1);
      }
    },
    [titleFontSizeLevel],
  );

  // 处理时间文本布局，逐步减小字号
  const handleTimeTextLayout = useCallback(
    (event: TextLayoutEvent) => {
      if (timeFontSizeLevel >= FONT_SIZE_LEVELS.time.length - 1) return;
      const textWidth = event.nativeEvent.lines[0]?.width ?? 0;
      // 检测文本是否会被截断
      if (textWidth > TEXT_OVERFLOW_THRESHOLD) {
        setTimeFontSizeLevel(prev => prev + 1);
      }
    },
    [timeFontSizeLevel],
  );

  // 定时更新当前时间
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 30000); // 每半分钟更新一次

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="flex w-[32px] flex-shrink-0 flex-grow-0 basis-[32px] flex-col">
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
              className={cn('font-bold', isActive ? 'text-primary' : 'text-text-secondary')}
              numberOfLines={1}
              onTextLayout={handleTitleTextLayout}
              style={[
                styles.robotoFont,
                {
                  fontSize: FONT_SIZE_LEVELS.title[titleFontSizeLevel],
                  lineHeight: FONT_SIZE_LEVELS.title[titleFontSizeLevel] * LINE_HEIGHT_RATIO.title,
                },
              ]}
            >
              {index + 1}
            </Text>
            <Text
              className={cn(isActive ? 'text-primary' : 'text-text-secondary')}
              numberOfLines={1}
              onTextLayout={handleTimeTextLayout}
              style={[
                styles.robotoFont,
                {
                  fontSize: FONT_SIZE_LEVELS.time[timeFontSizeLevel],
                  lineHeight: FONT_SIZE_LEVELS.time[timeFontSizeLevel] * LINE_HEIGHT_RATIO.time,
                },
              ]}
            >
              {time[0]}
            </Text>
            <Text
              className={cn(isActive ? 'text-primary' : 'text-text-secondary')}
              numberOfLines={1}
              onTextLayout={handleTimeTextLayout}
              style={[
                styles.robotoFont,
                {
                  fontSize: FONT_SIZE_LEVELS.time[timeFontSizeLevel],
                  lineHeight: FONT_SIZE_LEVELS.time[timeFontSizeLevel] * LINE_HEIGHT_RATIO.time,
                },
              ]}
            >
              {time[1]}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default memo(TimeCol);
