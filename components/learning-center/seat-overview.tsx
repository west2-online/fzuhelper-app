import { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

import type { SeatData } from '@/types/learning-center';
import { SeatAreaCharts, getSeatsSummary } from '@/utils/learning-center/seats';

interface SeatOverviewProps {
  area: string; // 区域名称
  areaSeats: SeatData[]; // 座位数据
}

const SeatOverview: React.FC<SeatOverviewProps> = ({ area, areaSeats }) => {
  const summary = useMemo(() => getSeatsSummary(areaSeats), [areaSeats]);

  return (
    <View className="mb-2 bg-card px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-medium text-primary">
          {area}：{SeatAreaCharts.find(([, , areaCode]) => areaCode === area)?.[3] || ''}
        </Text>
        <View className="flex-row items-center">
          <View className="mx-1 flex-row items-center">
            <View className="mr-1.5 h-3 w-3 rounded-full bg-green-200" />
            <Text className="text-sm text-text-secondary">可预约 {summary.available}</Text>
          </View>
          <View className="mx-1 flex-row items-center">
            <View className="mr-1.5 h-3 w-3 rounded-full bg-red-200" />
            <Text className="text-sm text-text-secondary">已占用 {summary.occupied}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default memo(SeatOverview);
