import React from 'react';
import { Linking, Text } from 'react-native';

export interface FAQItem {
  question: string;
  answer: string | (string | { text: string; url: string })[]; // 支持包含链接的复杂内容
}

// 渲染 answer 内容（支持纯文本和包含链接的混合内容）
const renderAnswer = (answer: FAQItem['answer']) => {
  if (typeof answer === 'string') {
    // 如果是纯文本，直接渲染
    return <Text className="mb-1 text-sm text-text-secondary">{answer}</Text>;
  }

  // 如果是数组，逐个渲染
  return (
    <Text className="mb-1 text-sm text-text-secondary">
      {answer.map((part, index) => {
        if (typeof part === 'string') {
          // 文本部分直接渲染
          return <Text key={index}>{part}</Text>;
        } else if (typeof part === 'object' && part.url) {
          // 链接部分渲染为可点击的文本
          return (
            <Text
              key={index}
              className="text-primary underline"
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

export default function FAQContent(item: FAQItem) {
  return (
    <>
      <Text className="mt-1 text-base font-semibold text-text-primary">{item.question}</Text>
      {renderAnswer(item.answer)}
    </>
  );
}
