import { memo, useMemo } from 'react';
import { Pressable, View, type LayoutRectangle } from 'react-native';

import { Text } from '@/components/ui/text';
import { SCHEDULE_ITEM_MARGIN, SCHEDULE_ITEM_MIN_HEIGHT } from '@/lib/course';

interface FreeFriendsColProps {
  freeCountPerSlot: number[];
  totalFriends: number;
  flatListLayout: LayoutRectangle;
  minItemHeight?: number;
  onSlotPress?: (period: number) => void;
}

// 都空闲 → 不显示；部分占课 → 黄色；全部占课 → 红色
const getSlotStyle = (count: number, total: number): { bg: string; text: string; label: string } | null => {
  const safeCount = Math.max(0, count); // clamp: data inconsistency safety net
  if (total === 0 || safeCount >= total) return null; // all free → empty
  const busy = total - safeCount;
  if (safeCount === 0) {
    // all busy
    return { bg: 'bg-red-400', text: 'text-white', label: `全忙` };
  }
  // some busy
  return { bg: 'bg-yellow-300', text: 'text-black', label: `${busy}人忙` };
};

const FreeFriendsCol: React.FC<FreeFriendsColProps> = ({
  freeCountPerSlot,
  totalFriends,
  flatListLayout,
  minItemHeight = SCHEDULE_ITEM_MIN_HEIGHT,
  onSlotPress,
}) => {
  const itemHeight = useMemo(
    () => Math.max(minItemHeight, Math.floor(flatListLayout.height / 11)),
    [flatListLayout.height, minItemHeight],
  );

  return (
    <View className="flex flex-shrink-0 flex-grow flex-col" style={{ width: flatListLayout.width / 7 }}>
      {freeCountPerSlot.map((count, index) => {
        const style = getSlotStyle(count, totalFriends);
        const period = index + 1;
        return (
          <View key={index} style={{ height: itemHeight, padding: SCHEDULE_ITEM_MARGIN }}>
            <Pressable
              className={`flex-1 items-center justify-center rounded ${style ? style.bg : ''}`}
              onPress={style ? () => onSlotPress?.(period) : undefined}
            >
              {style && (
                <Text className={`text-center text-[10px] font-bold ${style.text}`} numberOfLines={1}>
                  {style.label}
                </Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

export default memo(FreeFriendsCol);
