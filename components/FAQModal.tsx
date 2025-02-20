import React from 'react';
import { Linking, Modal, Pressable, Text, View } from 'react-native';

interface FAQItem {
  question: string;
  answer: string | (string | { text: string; url: string })[]; // 支持包含链接的复杂内容
}

interface FAQModalProps {
  visible: boolean; // 控制 Modal 显示与否
  onClose: () => void; // 关闭 Modal 的回调函数
  data: FAQItem[]; // FAQ 数据数组
}

const FAQModal: React.FC<FAQModalProps> = ({ visible, onClose, data }) => {
  // 渲染 answer 内容（支持纯文本和包含链接的混合内容）
  const renderAnswer = (answer: FAQItem['answer']) => {
    if (typeof answer === 'string') {
      // 如果是纯文本，直接渲染
      return <Text className="mb-1 text-sm text-gray-600">{answer}</Text>;
    }

    // 如果是数组，逐个渲染
    return (
      <Text className="mb-1 text-sm text-gray-600">
        {answer.map((part, index) => {
          if (typeof part === 'string') {
            // 文本部分直接渲染
            return <Text key={index}>{part}</Text>;
          } else if (typeof part === 'object' && part.url) {
            // 链接部分渲染为可点击的文本
            return (
              <Text
                key={index}
                className="text-blue-500 underline"
                onPress={() => Linking.openURL(part.url)} // 点击打开链接
              >
                {part.text}
              </Text>
            );
          }
          return null;
        })}
      </Text>
    );
  };

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
                  {renderAnswer(item.answer)}
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
