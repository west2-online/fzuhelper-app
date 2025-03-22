import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { cn } from '@/lib/utils';

interface SeatCardProps {
  spaceName: string;
  onPress: () => void;
  isAvailable?: boolean;
}

const SeatCard: React.FC<SeatCardProps> = ({ spaceName, onPress, isAvailable = true }) => (
  <View className="flex h-[56px] flex-1 p-1">
    <TouchableOpacity
      onPress={onPress}
      className={cn(
        'flex flex-1 items-center justify-center rounded-lg py-4',
        isAvailable ? 'bg-green-200' : 'bg-red-200',
      )}
    >
      <Text className={cn('text-center', isAvailable ? 'text-green-800' : 'text-red-800')}>{spaceName}</Text>
    </TouchableOpacity>
  </View>
);

export default memo(SeatCard);
