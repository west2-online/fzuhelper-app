import WheelPicker from '@quidone/react-native-wheel-picker';
import { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import IcCancel from '@/assets/images/misc/ic_cancel.svg';
import IcConfirm from '@/assets/images/misc/ic_confirm.svg';
import { Text } from '@/components/ui/text';

interface PickerModalProps {
  visible: boolean;
  title: string;
  data: { value: string; label: string }[];
  value: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

export default function PickerModal({ visible, title, data, value, onClose, onConfirm }: PickerModalProps) {
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleConfirm = () => {
    onConfirm(tempValue);
  };

  return (
    <Modal
      visible={visible}
      transparent
      navigationBarTranslucent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex flex-1 justify-end">
        <Pressable className="absolute h-full w-full bg-[#00000050]" onPress={onClose} />
        <View className="space-y-6 rounded-t-3xl bg-background p-6">
          <View className="flex-row justify-between">
            <Pressable onPress={onClose}>
              <IcCancel className="m-1 h-6 w-6" />
            </Pressable>
            <Text className="text-xl font-bold text-primary">{title}</Text>
            <Pressable onPress={handleConfirm}>
              <IcConfirm className="m-1 h-6 w-6" />
            </Pressable>
          </View>
          <View className="overflow-hidden">
            <WheelPicker data={data} value={tempValue} onValueChanged={({ item: { value } }) => setTempValue(value)} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
