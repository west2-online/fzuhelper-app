import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQModalProps {
  visible: boolean; // 控制 Modal 显示与否
  onClose: () => void; // 关闭 Modal 的回调函数
  data: FAQItem[]; // FAQ 数据数组
}

const FAQModal: React.FC<FAQModalProps> = ({ visible, onClose, data }) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <Pressable
        className="flex-1"
        onPress={onClose} // 点击外部关闭 Modal
      >
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="max-h-3/5 w-4/5 rounded-2xl bg-white p-5">
            {/* 标题 */}
            <Text className="mb-4 text-center text-xl font-bold">常见问题 (FAQ)</Text>

            {/* 动态渲染 FAQ 内容 */}
            <View className="space-y-4">
              {data.map((item, index) => (
                <View key={index}>
                  <Text className="mt-1 text-base font-semibold text-gray-800">{item.question}</Text>
                  <Text className="mb-1 text-sm text-gray-600">{item.answer}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default FAQModal;
