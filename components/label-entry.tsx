import { Icon } from '@/components/Icon';
import { cn } from '@/lib/utils';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface LabelEntryProps {
  leftText: string;
  rightText?: string;
  onPress?: () => void;
  description?: string;
  disabled?: boolean;
  className?: string;
}

const LabelEntry: React.FC<LabelEntryProps> = ({
  leftText,
  rightText,
  description,
  onPress,
  disabled = false,
  className,
}) => {
  return (
    <TouchableOpacity
      className={cn('flex-row items-center justify-between space-y-4 py-4', className)}
      onPress={onPress}
      disabled={disabled}
    >
      <View className="w-full flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-text-primary truncate text-lg">{leftText}</Text>
          {description && <Text className="text-text-secondary text-sm">{description}</Text>}
        </View>
        <View className="ml-3 flex-row items-center">
          <Text className="text-text-secondary mr-3 truncate text-lg">{rightText}</Text>
          <Icon name="chevron-forward-outline" size={14} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LabelEntry;
