import { memo } from 'react';
import { View } from 'react-native';

import { SCHEDULE_ITEM_MARGIN } from '@/lib/course';

interface EmptySlotProps {
  itemHeight: number;
}

// 空白的课程表单元格
// 不具有任何的显示内容，只是用于在元素排布中的占位
const EmptyScheduleItem: React.FC<EmptySlotProps> = ({ itemHeight }) => (
  <View className="flex" style={{ padding: SCHEDULE_ITEM_MARGIN, height: itemHeight }}>
    <View className="flex-1" />
  </View>
);

export default memo(EmptyScheduleItem);
