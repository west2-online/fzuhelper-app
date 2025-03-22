import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { cn } from '@/lib/utils';
import { SEAT_ITEM_HEIGHT } from '@/utils/learning-center/seats';

interface SeatCardProps {
  spaceName: string;
  onPress: () => void;
  isAvailable?: boolean;
}

const SeatCard: React.FC<SeatCardProps> = ({ spaceName, onPress, isAvailable = true }) => {
  const [line1, line2] = spaceName.split('\n');

  return (
    <View className={cn('flex flex-1 p-1')} style={{ height: SEAT_ITEM_HEIGHT }}>
      <TouchableOpacity
        onPress={onPress}
        className={cn(
          'flex flex-1 items-center justify-center rounded-lg py-2',
          isAvailable ? 'bg-green-200' : 'bg-red-200',
        )}
      >
        <Text className={cn('text-center', isAvailable ? 'text-green-800' : 'text-red-800')}>{line1}</Text>
        {line2 && (
          <Text className={cn('text-center text-xs', isAvailable ? 'text-green-800' : 'text-red-800')}>{line2}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default memo(SeatCard);
