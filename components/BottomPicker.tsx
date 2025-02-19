import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import WheelPicker from '@/components/wheelPicker';
import React from 'react';
import { Modal, TouchableWithoutFeedback, View } from 'react-native';

interface BottomPickerProps {
  visible: boolean;
  title: string;
  data: string[];
  selectIndex: number;
  onChange: (index: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const BottomPicker: React.FC<BottomPickerProps> = ({
  visible,
  title,
  data,
  selectIndex,
  onChange,
  onConfirm,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose} // Android 返回键关闭
    >
      {/* 点击背景关闭 */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50" />
      </TouchableWithoutFeedback>

      {/* Picker 容器 */}
      <View className="space-y-6 rounded-t-2xl bg-background p-6 pb-10">
        <Text className="text-center text-xl font-bold">{title}</Text>
        <WheelPicker data={data} wheelWidth="100%" selectIndex={selectIndex} onChange={onChange} />

        {/* 确认按钮 */}
        <Button className="mt-6" onPress={onConfirm}>
          <Text>确认</Text>
        </Button>
      </View>
    </Modal>
  );
};

export default BottomPicker;
