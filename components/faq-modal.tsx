import FAQContent, { FAQItem } from '@/components/faq-content';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

interface FAQModalProps {
  visible: boolean; // 控制 Modal 显示与否
  onClose: () => void; // 关闭 Modal 的回调函数
  data: FAQItem[]; // FAQ 数据数组
}

const FAQModal: React.FC<FAQModalProps> = ({ visible, onClose, data }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-black/50">
        <Pressable className="absolute h-full w-full" onPress={onClose} />
        <View className="max-h-3/5 w-4/5 rounded-2xl bg-background p-5">
          {/* 标题 */}
          <Text className="mb-4 text-center text-xl font-bold text-primary">常见问题 (FAQ)</Text>

          {/* 动态渲染 FAQ 内容 */}
          <View className="space-y-4">
            {data.map((item, index) => (
              <FAQContent key={index} question={item.question} answer={item.answer} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FAQModal;
