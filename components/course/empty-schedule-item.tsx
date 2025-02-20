import { View } from 'react-native';

import { SCHEDULE_ITEM_MIN_HEIGHT } from '@/utils/course';

interface EmptySlotProps {
  height: number;
}

// 空白的课程表单元格
// 不具有任何的显示内容，只是用于在元素排布中的占位
const EmptyScheduleItem: React.FC<EmptySlotProps> = ({ height }) => (
  <View
    className="flex-grow-1 m-[1px] flex flex-shrink-0 basis-0 flex-col items-center justify-center"
    style={{ height: height / 11, minHeight: SCHEDULE_ITEM_MIN_HEIGHT }}
  />
);

export default EmptyScheduleItem;
