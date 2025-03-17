import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { cn } from '@/lib/utils';

interface ColorRadioButtonProps {
  options: { value: string; color: string }[]; // 单选框的选项，包含 value 和颜色
  selectedValue: string; // 当前选中的值
  onChange: (value: string) => void; // 选中值变化时的回调
  className?: string; // 自定义样式
}

const ColorRadioButton: React.FC<ColorRadioButtonProps> = ({ options, selectedValue, onChange, className }) => {
  return (
    <View className={cn('flex-row items-center justify-center', className)}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          className={cn(
            'mx-2 h-8 w-8 rounded-full',
            selectedValue === option.value ? 'border-2 border-primary' : 'border border-gray-300',
          )}
          style={{ backgroundColor: option.color }}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
};

export default ColorRadioButton;
