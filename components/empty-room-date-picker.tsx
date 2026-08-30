import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import DateTimePicker, { useDefaultClassNames } from 'react-native-ui-datepicker';

import FloatModal from '@/components/ui/float-modal';
import type { EmptyRoomDatePickerProps } from './empty-room-date-picker.types';

const TIMEZONE = 'Asia/Shanghai';
const DATE_FMT = 'YYYY-MM-DD';

export default function EmptyRoomDatePicker({ visible, value, data, onClose, onConfirm }: EmptyRoomDatePickerProps) {
  const defaultClassNames = useDefaultClassNames();
  const [tempValue, setTempValue] = useState(value);
  const minDate = data[0]?.value;
  const maxDate = data[data.length - 1]?.value;

  useEffect(() => {
    if (visible) {
      setTempValue(value);
    }
  }, [value, visible]);

  return (
    <FloatModal
      visible={visible}
      transparent
      title="选择日期"
      onClose={onClose}
      onConfirm={() => onConfirm(tempValue)}
      contentContainerClassName="h-96 items-center"
    >
      <DateTimePicker
        mode="single"
        date={dayjs(tempValue).toDate()}
        timeZone={TIMEZONE}
        onChange={({ date }) => {
          if (date) {
            setTempValue(dayjs(date).format(DATE_FMT));
          }
        }}
        locale="zh-cn"
        classNames={defaultClassNames}
        minDate={minDate ? dayjs(minDate).toDate() : undefined}
        maxDate={maxDate ? dayjs(maxDate).toDate() : undefined}
      />
    </FloatModal>
  );
}
