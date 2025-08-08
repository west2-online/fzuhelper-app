import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { cn } from '@/lib/utils';
import { SEAT_ITEM_HEIGHT } from '@/utils/learning-center/seats';

interface SeatCardProps {
  spaceName: string;
  width: number;
  onPress: () => void;
  isAvailable?: boolean;
}

const SeatCard: React.FC<SeatCardProps> = ({ spaceName, width, onPress, isAvailable = true }) => {
  const [line1, line2] = spaceName.split('\n');

  return (
    <View className={cn('box-border flex p-1')} style={{ height: SEAT_ITEM_HEIGHT, width }}>
      <TouchableOpacity
        onPress={onPress}
        className={cn(
          'flex flex-1 items-center justify-center rounded-lg',
          isAvailable ? 'bg-green-200' : 'bg-red-200',
        )}
        activeOpacity={0.7}
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
