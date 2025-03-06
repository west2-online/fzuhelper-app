import React, { forwardRef } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/ui/text';

import { cn } from '@/lib/utils';

interface LabelEntryProps {
  leftText: string;
  rightText?: string;
  onPress?: () => void;
  description?: string;
  disabled?: boolean;
  noIcon?: boolean;
  className?: string;
}

// eslint-disable-next-line react/display-name
const LabelEntry: React.FC<LabelEntryProps> = forwardRef<React.ElementRef<typeof TouchableOpacity>, LabelEntryProps>(
  ({ leftText, rightText, description, onPress, disabled = false, noIcon = false, className }, ref) => (
    <TouchableOpacity
      className={cn('flex-row items-center justify-between space-y-4 py-4', className)}
      onPress={onPress}
      disabled={disabled}
      ref={ref}
    >
      <View className="w-full flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="truncate text-lg">{leftText}</Text>
          {description && <Text className="text-sm text-text-secondary">{description}</Text>}
        </View>
        <View className="ml-3 flex-row items-center">
          <Text className="mr-3 truncate text-lg text-text-secondary">{rightText}</Text>
          {!noIcon && <Icon name="chevron-forward" size={20} className="text-text-secondary" />}
        </View>
      </View>
    </TouchableOpacity>
  ),
);

export default LabelEntry;
