import { Text } from '@/components/ui/text';
import { SeatAreaCharts } from '@/utils/learning-center/seats';
import React from 'react';
import { View } from 'react-native';

type SeatOverviewProps = {
  area: string; // 区域名称
  seats: Record<string, any[]>; // 座位数据
  getSeatsSummary: (areaSeats: any[]) => { total: number; available: number; occupied: number }; // 获取座位概要信息的函数
};

const SeatOverview: React.FC<SeatOverviewProps> = ({ area, seats, getSeatsSummary }) => {
  const areaSeats = seats[area] || [];
  const summary = getSeatsSummary(areaSeats);

  return (
    <View className="mx-2 mb-2 px-4 py-3">
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

export default SeatOverview;
