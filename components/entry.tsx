import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/ui/text';

import { cn } from '@/lib/utils';

interface EntryProps {
  text?: string;
  placeholder?: string;
  onPress?: () => void;
  disabled?: boolean;
  noIcon?: boolean;
  className?: string;
}

const Entry: React.FC<EntryProps> = ({ text, placeholder, onPress, disabled = false, noIcon = false, className }) => (
  <TouchableOpacity
    className={cn('flex-row items-center justify-between py-2', className)}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled}
  >
    <View className="flex-row items-center">
      <Text className={cn('truncate text-lg', text ? 'text-text-primary' : 'text-text-secondary')}>
        {text || placeholder}
      </Text>
      {!noIcon && <Icon name="caret-down-outline" size={10} className="ml-6 text-text-secondary" />}
    </View>
  </TouchableOpacity>
);

export default Entry;
