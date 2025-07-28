import WheelPicker from '@quidone/react-native-wheel-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, View, useColorScheme } from 'react-native';

import IcCancel from '@/assets/images/misc/ic_cancel.svg';
import IcConfirm from '@/assets/images/misc/ic_confirm.svg';
import { Text } from '@/components/ui/text';

interface PickerModalProps<T> {
  visible: boolean;
  title: string;
  data: { value: T; label: string }[];
  value: T;
  onClose: () => void;
  onConfirm: (value: T) => void;
}

export default function PickerModal<T>({ visible, title, data, value, onClose, onConfirm }: PickerModalProps<T>) {
  const [tempValue, setTempValue] = useState(value);
  const colorScheme = useColorScheme();
  const itemTextStyle = useMemo(() => ({ color: colorScheme === 'dark' ? 'white' : 'black' }), [colorScheme]);

  useEffect(() => {
    // newArch下，关闭时重置选中值，打开时重新渲染，否则高度偏移有问题
    // setTempValue(visible ? value : (undefined as T));
    visible && setTempValue(value);
  }, [value, visible]);

  const handleConfirm = useCallback(() => {
    onConfirm(tempValue);
  }, [onConfirm, tempValue]);

  const onValueChanged = useCallback(({ item }: { item: { value: T } }) => {
    setTempValue(item.value);
  }, []);

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
          {/* 外部区域会无法点击，需要overflow-hidden；newArch下无此问题 */}
          <View className="overflow-hidden">
            <WheelPicker data={data} value={tempValue} onValueChanged={onValueChanged} itemTextStyle={itemTextStyle} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
