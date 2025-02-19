import { Text } from '@/components/ui/text';
import React from 'react';
import { View } from 'react-native';

// 不展示'学分'二字的学分类型
const NOT_SHOW_CREDIT_TYPE: string[] = ['CET-4', 'CET-6'] as const;

interface CreditCardProps {
  item: {
    type: string; // 学分类型
    gain: string; // 已获得学分
    total: string; // 总学分
  };
}

export const CreditCard: React.FC<CreditCardProps> = ({ item }) => {
  // 处理学分数据
  const gain = parseFloat(item.gain) || 0; // 已获得学分，默认为 0
  const total = parseFloat(item.total) || 0; // 总所需学分，默认为 0
  const remaining = Math.max(total - gain, 0); // 还需修的学分，最小为 0

  // 动态计算提示信息
  const remainingText =
    item.total.trim() === '' // 判断 total 是否为空（排除空格）
      ? ''
      : remaining === 0
        ? '(已满足)'
        : `(还需 ${remaining}分)`;

  return (
    <View className="mb-1 mt-1 flex-row justify-between p-2" key={item.type}>
      {/* 学分类型 */}
      <Text>{item.type}</Text>

      {/* 已获得学分 / 总学分 */}
      <Text className="font-bold">
        {gain}
        {item.total.trim() === '' ? '' : '/' + total}
        {NOT_SHOW_CREDIT_TYPE.includes(item.type) ? '' : `分 ${remainingText}`}
      </Text>
    </View>
  );
};
