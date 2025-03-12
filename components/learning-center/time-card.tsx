import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { Pressable } from 'react-native';

// 定义容器的样式变体
const containerVariants = cva('m-1 flex-1 rounded-lg p-3', {
  variants: {
    state: {
      disabled: 'bg-muted opacity-40',
      selected: 'bg-primary',
      included: 'bg-primary/50',
      default: 'bg-card',
    },
  },
  defaultVariants: {
    state: 'default',
  },
});

// 定义文字的样式变体
const textVariants = cva('text-center', {
  variants: {
    state: {
      disabled: 'text-text-secondary',
      selected: 'text-white',
      included: 'text-white',
      default: 'text-foreground',
    },
  },
  defaultVariants: {
    state: 'default',
  },
});

// 组件属性类型
type TimeCardProps = {
  time: string;
  onPress: () => void;
} & VariantProps<typeof containerVariants>;

const TimeCard: React.FC<TimeCardProps> = ({ time, state, onPress }) => {
  return (
    <Pressable onPress={onPress} disabled={state === 'disabled'} className={cn(containerVariants({ state }))}>
      <Text className={cn(textVariants({ state }))}>{time}</Text>
    </Pressable>
  );
};

export default TimeCard;
