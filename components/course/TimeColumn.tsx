import { CLASS_SCHEDULES } from '@/lib/constants'; // 时间段数据
import React from 'react';
import { Text, View } from 'react-native';

// 课程表的左侧时间段列
const TimeColumn: React.FC = () => {
  return (
    <View className="flex w-[32px] flex-shrink-0 flex-grow-0 basis-[32px] flex-col">
      {CLASS_SCHEDULES.map((time, index) => (
        <View key={index} className="flex min-h-14 w-[32px] flex-grow flex-col items-center py-1">
          <Text className="text-[12px] font-bold text-gray-500">{index + 1}</Text>
          <Text className="text-[8px] text-gray-500">{time[0]}</Text>
          <Text className="text-[8px] text-gray-500">{time[1]}</Text>
        </View>
      ))}
    </View>
  );
};

export default TimeColumn;
