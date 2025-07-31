import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, SectionList, TouchableOpacity, useWindowDimensions, View, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

import SeatCard from '@/components/learning-center/seat-card';
import SeatOverview from '@/components/learning-center/seat-overview';
import { cn } from '@/lib/utils';
import type { SeatData } from '@/types/learning-center';
import { convertSpaceName, groupSeatsByArea, SEAT_ITEM_HEIGHT, SpaceStatus } from '@/utils/learning-center/seats';

interface Section {
  title: string;
  data: SeatData[][];
}

interface LearningCenterSeatsListProps {
  data: SeatData[];
  onSeatPress: (spaceName: string, isAvailable: boolean) => void;
}

const NUM_COLUMNS = 4;
const RIGHT_SIDEBAR_WIDTH = 70; // 右侧边栏宽度

const LearningCenterSeatsList: React.FC<LearningCenterSeatsListProps> = ({ data, onSeatPress }) => {
  const sectionListRef = useRef<SectionList<SeatData[], Section>>(null);
  const [currentArea, setCurrentArea] = useState('');
  const isAutoScrolling = useRef(false);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const itemWidth = useMemo(() => (screenWidth - RIGHT_SIDEBAR_WIDTH) / NUM_COLUMNS, [screenWidth]);

  const groupedData = useMemo(
    () =>
      Object.entries(groupSeatsByArea(data))
        .filter(([_, seats]) => seats.length > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([title, data]) => ({ title, data })),
    [data],
  );

  const sortedKeys = useMemo(() => groupedData.map(item => item.title), [groupedData]);
  const chunkedGroupedData = useMemo(
    () =>
      groupedData.map(section => {
        const chunked = [];
        for (let i = 0; i < section.data.length; i += NUM_COLUMNS) {
          chunked.push(section.data.slice(i, i + NUM_COLUMNS));
        }
        return { ...section, data: chunked };
      }),
    [groupedData],
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<SeatData[]>[]; changed: ViewToken<SeatData[]>[] }) => {
      if (isAutoScrolling.current) return;
      const sectionIndexList = viewableItems
        .filter(item => item.section !== null)
        .map(item => item.section as Section)
        .map(section => sortedKeys.indexOf(section.title));
      const currentSectionIndex = Math.min(...sectionIndexList);
      setCurrentArea(groupedData[currentSectionIndex]?.title);
    },
    [groupedData, sortedKeys],
  );

  const handlePress = useCallback((sectionIndex: number, sectionTitle: string) => {
    isAutoScrolling.current = true;
    setCurrentArea(sectionTitle);
    sectionListRef.current?.scrollToLocation({
      sectionIndex,
      // itemIndex 设置为 0 不行，只会滚动到最顶部
      // https://stackoverflow.com/questions/76311750/scrolltolocation-always-scrolling-to-top-in-sectionlist-in-react-native
      itemIndex: 1, // 滚动到段落的第一个项目
      animated: true,
      viewPosition: 0, // 对齐到视口顶部
      viewOffset: 0,
    });
  }, []);

  return (
    <View className="flex-1">
      <SectionList
        ref={sectionListRef}
        sections={chunkedGroupedData}
        keyExtractor={(item, index) => item[0]?.spaceName || `index_${index}`}
        renderItem={({ item }) => (
          <View className="flex-row">
            {item.map(seat => (
              <SeatCard
                key={seat.spaceName}
                width={itemWidth}
                spaceName={convertSpaceName(seat.spaceName)}
                onPress={() => onSeatPress(seat.spaceName, seat.spaceStatus === SpaceStatus.Available)}
                isAvailable={seat.spaceStatus === SpaceStatus.Available}
              />
            ))}
          </View>
        )}
        renderSectionHeader={({ section }) => <SeatOverview area={section.title} areaSeats={section.data.flat()} />}
        className={`mr-[${RIGHT_SIDEBAR_WIDTH}px] rounded-tr-4xl bg-card`}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        onViewableItemsChanged={handleViewableItemsChanged}
        onScrollEndDrag={() => {
          isAutoScrolling.current = false;
        }}
        onScrollAnimationEnd={() => {
          isAutoScrolling.current = false;
        }}
        initialNumToRender={20}
        getItemLayout={(_, index) => ({
          index,
          length: SEAT_ITEM_HEIGHT,
          offset: SEAT_ITEM_HEIGHT * index,
        })}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 0 }}
        overScrollMode="never"
      />

      <View className={`absolute bottom-0 right-0 top-12 w-[${RIGHT_SIDEBAR_WIDTH}px] pr-2`}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom }}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
        >
          {groupedData.map((section, index) => (
            <TouchableOpacity
              key={section.title}
              onPress={() => handlePress(index, section.title)}
              className="mb-4"
              activeOpacity={0.7}
            >
              <View
                className={cn(
                  'rounded-br-xl rounded-tr-xl px-4 py-2',
                  section.title === currentArea ? 'bg-primary' : 'bg-gray-300',
                )}
              >
                <Text className="text-center text-base font-bold text-white">{section.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default memo(LearningCenterSeatsList);
