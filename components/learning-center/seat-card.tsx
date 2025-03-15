import React, { memo } from 'react';
import { Text, TouchableOpacity } from 'react-native';

const SeatCard: React.FC<{
  spaceName: string;
  onPress: () => void;
  isAvailable?: boolean;
}> = memo(({ spaceName, onPress, isAvailable = true }) => {
  // 根据是否可用设置不同的背景色
  const bgColorClass = isAvailable ? 'bg-green-200' : 'bg-red-200';
  const textColorClass = isAvailable ? 'text-green-800' : 'text-red-800';

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`m-1 flex flex-1 items-center justify-center rounded-lg ${bgColorClass} py-4`}
    >
      <Text className={`text-center ${textColorClass}`}>{spaceName}</Text>
    </TouchableOpacity>
  );
});
SeatCard.displayName = 'SeatCard';

export default SeatCard;
