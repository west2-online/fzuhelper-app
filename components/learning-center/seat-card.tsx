import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { cn } from '@/lib/utils';

interface SeatCardProps {
  spaceName: string;
  onPress: () => void;
  isAvailable?: boolean;
}

const SeatCard: React.FC<SeatCardProps> = ({ spaceName, onPress, isAvailable = true }) => {
  const hasMultipleLines = spaceName.includes('\n');

  return (
    <View className={cn('flex flex-1 p-1', hasMultipleLines ? 'h-[70px]' : 'h-[56px]')}>
      <TouchableOpacity
        onPress={onPress}
        className={cn(
          'flex flex-1 items-center justify-center rounded-lg py-2',
          isAvailable ? 'bg-green-200' : 'bg-red-200',
        )}
      >
        <Text className={cn('text-center', isAvailable ? 'text-green-800' : 'text-red-800')} numberOfLines={2}>
          {spaceName}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default memo(SeatCard);
