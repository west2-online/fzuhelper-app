import PickerModal from '@/components/picker-modal';
import type { EmptyRoomDatePickerProps } from './empty-room-date-picker.types';

export default function EmptyRoomDatePicker({ visible, value, data, onClose, onConfirm }: EmptyRoomDatePickerProps) {
  return (
    <PickerModal visible={visible} title="选择日期" value={value} data={data} onClose={onClose} onConfirm={onConfirm} />
  );
}
