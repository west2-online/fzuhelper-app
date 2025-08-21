import FAQContent, { FAQItem } from '@/components/faq-content';
import { useFocusEffect } from 'expo-router';
import React, { memo, useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface FAQModalProps {
  visible: boolean; // 控制 Modal 显示与否
  onClose: () => void; // 关闭 Modal 的回调函数
  data: FAQItem[]; // FAQ 数据数组
}

const FAQModal: React.FC<FAQModalProps> = ({ visible, onClose, data }) => {
  const [pageVisible, setPageVisible] = useState(true);

  // 当所在页面可见时才显示
  useFocusEffect(
    useCallback(() => {
      setPageVisible(true);
      return () => {
        setPageVisible(false);
      };
    }, []),
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible && pageVisible}
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-black/50">
        <Pressable className="absolute h-full w-full" onPress={onClose} />
        <View className="-max-h-screen-safe-offset-8 w-4/5 rounded-2xl bg-background p-5">
          {/* 标题 */}
          <Text className="mb-4 text-center text-xl font-bold text-primary">常见问题 (FAQ)</Text>

          {/* 动态渲染 FAQ 内容 */}
          <ScrollView className="space-y-4" showsVerticalScrollIndicator={false} overScrollMode="never">
            {data.map((item, index) => (
              <FAQContent key={index} question={item.question} answer={item.answer} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default memo(FAQModal);
