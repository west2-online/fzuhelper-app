import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { FlatList, useWindowDimensions, type LayoutRectangle } from 'react-native';

import FreeFriendsWeek from '@/components/free-friends/free-friends-week';
import { getFirstDateByWeek } from '@/lib/locate-date';

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

export interface FreeFriendsGridRef {
  scrollToWeek: (week: number) => void;
}

interface FreeFriendsGridProps {
  selectedWeek: number;
  onWeekChange: (week: number) => void;
  // allFreeMatrix[week-1][day][period-1] = number of free friends
  allFreeMatrix: number[][][];
  totalFriends: number;
  maxWeek: number;
  currentTerm: { start_date: string };
  onSlotPress?: (week: number, day: number, period: number) => void;
}

const FreeFriendsGrid = forwardRef<FreeFriendsGridRef, FreeFriendsGridProps>(
  ({ selectedWeek, onWeekChange, allFreeMatrix, totalFriends, maxWeek, currentTerm, onSlotPress }, ref) => {
    const { width } = useWindowDimensions();
    const [flatListLayout, setFlatListLayout] = useState<LayoutRectangle>({ width, height: 0, x: 0, y: 0 });
    const flatListRef = useRef<FlatList>(null);

    const weekArray = useMemo(
      () =>
        Array.from({ length: maxWeek }, (_, i) => ({
          week: i + 1,
          firstDate: getFirstDateByWeek(currentTerm.start_date, i + 1),
        })),
      [maxWeek, currentTerm],
    );

    const safeSetSelectedWeek = useCallback(
      (week: number, scrollTo = true) => {
        const target = Math.max(1, Math.min(week, maxWeek));
        onWeekChange(target);
        if (scrollTo && flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: target - 1, animated: false });
        }
      },
      [maxWeek, onWeekChange],
    );

    useImperativeHandle(ref, () => ({ scrollToWeek: (w: number) => safeSetSelectedWeek(w) }));

    const handleViewableItemsChanged = useCallback(
      ({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems.length > 0) {
          const w = viewableItems[0].item.week;
          onWeekChange(w);
        }
      },
      [onWeekChange],
    );

    const getItemLayout = useCallback(
      (_: any, index: number) => ({ length: width, offset: width * index, index }),
      [width],
    );

    const renderItem = useCallback(
      ({ item }: { item: (typeof weekArray)[0] }) => (
        <FreeFriendsWeek
          week={item.week}
          startDate={item.firstDate}
          freeMatrix={allFreeMatrix[item.week - 1] ?? Array.from({ length: 7 }, () => new Array(11).fill(0))}
          totalFriends={totalFriends}
          flatListLayout={flatListLayout}
          onSlotPress={(day, period) => onSlotPress?.(item.week, day, period)}
        />
      ),
      [allFreeMatrix, totalFriends, flatListLayout, onSlotPress],
    );

    const onLayout = useCallback(({ nativeEvent }: { nativeEvent: { layout: LayoutRectangle } }) => {
      setFlatListLayout(nativeEvent.layout);
    }, []);

    return (
      <FlatList
        className="flex-1"
        ref={flatListRef}
        horizontal
        pagingEnabled
        data={weekArray}
        initialNumToRender={1}
        windowSize={3}
        getItemLayout={getItemLayout}
        initialScrollIndex={selectedWeek - 1}
        renderItem={renderItem}
        onLayout={onLayout}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        showsHorizontalScrollIndicator={false}
      />
    );
  },
);

FreeFriendsGrid.displayName = 'FreeFriendsGrid';

export default FreeFriendsGrid;
