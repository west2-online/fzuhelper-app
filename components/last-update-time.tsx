import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Icon } from './Icon';

interface LastUpdateTimeProps {
  className?: string; // 额外的样式类名
  text?: string;
  lastUpdated?: Date;
  lastUpdatedText?: string; // 历史遗留，课程部分存的是string而非Date。两者二选一
}

const LastUpdateTime: React.FC<LastUpdateTimeProps> = ({ className, text, lastUpdated, lastUpdatedText }) => {
  const innerText = useMemo(() => (text === undefined ? '数据同步时间：' : text), [text]);

  return (
    <View className={cn('mb-3 mt-1 flex flex-row items-center justify-center rounded-lg p-2', className)}>
      <Icon name="time-outline" size={16} className="mr-2" />
      <Text className="text-l leading-5 text-text-primary">
        {innerText}
        {lastUpdatedText}
        {lastUpdated?.toLocaleString()}
      </Text>
    </View>
  );
};

export default LastUpdateTime;
