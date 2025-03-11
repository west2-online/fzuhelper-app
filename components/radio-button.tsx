import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface RadioButtonProps {
  options: { value: string; label: string }[]; // 单选框的选项
  selectedValue: string; // 当前选中的值
  onChange: (value: string) => void; // 选中值变化时的回调
  className?: string; // 自定义样式
}

const RadioButton: React.FC<RadioButtonProps> = ({ options, selectedValue, onChange, className }) => {
  return (
    <View className={cn('flex-row items-center justify-center', className)}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          className={cn(
            'mx-4 flex-row items-center rounded-lg px-4 py-2',
            selectedValue === option.value ? 'bg-primary' : 'bg-secondary',
          )}
          onPress={() => onChange(option.value)}
        >
          <Text className={cn('text-lg', selectedValue === option.value ? 'text-secondary' : 'text-text-primary')}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default RadioButton;
