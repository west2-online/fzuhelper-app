import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { Pressable } from 'react-native';

// 定义容器的样式变体
const containerVariants = cva('m-1 flex-1 rounded-lg p-3', {
  variants: {
    state: {
      selected: 'bg-primary',
      default: 'bg-card',
    },
  },
  defaultVariants: {
    state: 'default',
  },
});

// 定义日期文本的样式变体
const dateTextVariants = cva('text-center font-medium', {
  variants: {
    state: {
      selected: 'text-primary-foreground',
      default: 'text-foreground',
    },
  },
  defaultVariants: {
    state: 'default',
  },
});

// 定义星期文本的样式变体
const weekTextVariants = cva('text-center text-xs', {
  variants: {
    state: {
      selected: 'text-primary-foreground',
      default: 'text-text-secondary',
    },
  },
  defaultVariants: {
    state: 'default',
  },
});

// 组件属性类型
type DateCardProps = {
  date: string; // 日期
  day: string; // 周一、周二、周三
  onPress: () => void;
} & VariantProps<typeof containerVariants>;

const DateCard: React.FC<DateCardProps> = ({ date, day, state, onPress }) => {
  return (
    <Pressable onPress={onPress} className={cn(containerVariants({ state }))}>
      <Text className={cn(dateTextVariants({ state }))}>{date}</Text>
      <Text className={cn(weekTextVariants({ state }))}>{day}</Text>
    </Pressable>
  );
};

export default DateCard;
