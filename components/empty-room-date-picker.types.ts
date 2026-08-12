export interface EmptyRoomDatePickerOption {
  value: string;
  label: string;
}

export interface EmptyRoomDatePickerProps {
  visible: boolean;
  value: string;
  data: EmptyRoomDatePickerOption[];
  onClose: () => void;
  onConfirm: (value: string) => void;
}
