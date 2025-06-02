import { TouchableOpacity, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

import { cn } from '@/lib/utils';

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  selected: string;
  onChange: (value: string) => void;
  customText?: string;
  onCustomTextChange?: (text: string) => void;
  customPlaceholder?: string;
}

export default function RadioGroup({
  options,
  selected,
  onChange,
  customText,
  onCustomTextChange,
  customPlaceholder = '请输入其他内容',
}: Props) {
  return (
    <View className="space-y-4">
      {options.map(option => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity key={option.value} className="flex-row items-start" onPress={() => onChange(option.value)}>
            <View className="mr-3 mt-1">
              <View
                className={cn(
                  'h-4 w-4 items-center justify-center rounded-full border-2',
                  isSelected ? 'border-blue-500' : 'border-gray-400',
                )}
              >
                {isSelected && <View className="h-2 w-2 rounded-full bg-blue-500" />}
              </View>
            </View>
            <Text className="flex-1 flex-wrap text-base leading-6">{option.label}</Text>
          </TouchableOpacity>
        );
      })}

      {selected === 'other' && (
        <View className="flex-row items-center">
          <View className="mr-3 h-4 w-4" />
          <Input
            placeholder={customPlaceholder}
            placeholderTextColor="#999"
            value={customText}
            onChangeText={onCustomTextChange}
            className="flex-1 border-b border-blue-500 py-1 text-base"
          />
        </View>
      )}
    </View>
  );
}
