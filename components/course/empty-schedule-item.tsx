import { View } from 'react-native';

interface EmptySlotProps {
  height: number;
}

// 空白的课程表单元格
// 不具有任何的显示内容，只是用于在元素排布中的占位
const EmptyScheduleItem: React.FC<EmptySlotProps> = ({ height }) => (
  <View
    className="flex-grow-1 flex min-h-14 flex-shrink-0 basis-0 flex-col items-center justify-center"
    style={{ height: height / 11 }}
  />
);

export default EmptyScheduleItem;
