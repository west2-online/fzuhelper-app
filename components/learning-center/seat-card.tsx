import React, { memo } from 'react';
import { Text, TouchableOpacity } from 'react-native';

const SeatCard: React.FC<{
  spaceName: string;
  onPress: () => void;
}> = memo(({ spaceName, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} className="m-1 flex flex-1 items-center justify-center rounded-lg bg-card py-4">
      <Text className="text-center text-primary">{spaceName}</Text>
    </TouchableOpacity>
  );
});
SeatCard.displayName = 'SeatCard';

export default SeatCard;
