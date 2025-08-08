import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, SectionList, TouchableOpacity, useWindowDimensions, View, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

import SeatCard from '@/components/learning-center/seat-card';
import SeatOverview from '@/components/learning-center/seat-overview';
import { cn } from '@/lib/utils';
import type { SeatData } from '@/types/learning-center';
import {
  convertSpaceName,
  groupSeatsByArea,
  SEAT_ITEM_HEIGHT,
  SECTION_HEADER_HEIGHT,
  SpaceStatus,
} from '@/utils/learning-center/seats';
import rnSectionListGetItemLayout from '@/utils/rn-section-list-get-item-layout';

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

const LearningCenterSeatsList: React.FC<LearningCenterSeatsListProps> = ({ data: fullData, onSeatPress }) => {
  const sectionListRef = useRef<SectionList<SeatData[], Section>>(null);
  const [currentArea, setCurrentArea] = useState('');
  const isAutoScrolling = useRef(false);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const itemWidth = useMemo(() => (screenWidth - RIGHT_SIDEBAR_WIDTH) / NUM_COLUMNS, [screenWidth]);

  const groupedData = useMemo(
    () =>
      Object.entries(groupSeatsByArea(fullData))
        .filter(([_, seats]) => seats.length > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([title, data]) => ({ title, data })),
    [fullData],
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
      animated: false,
      viewPosition: 0, // 对齐到视口顶部
      viewOffset: 0,
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SeatData[] }) => (
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
    ),
    [itemWidth, onSeatPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => <SeatOverview area={section.title} areaSeats={section.data.flat()} />,
    [],
  );

  const getItemLayout = useMemo(() => {
    return rnSectionListGetItemLayout({
      getItemHeight: () => SEAT_ITEM_HEIGHT,
      getSectionHeaderHeight: () => SECTION_HEADER_HEIGHT,
    });
  }, []);

  return (
    <View className="flex-1">
      <SectionList
        ref={sectionListRef}
        sections={chunkedGroupedData}
        keyExtractor={(item, index) => item[0]?.spaceName || `index_${index}`}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        className="rounded-tr-4xl bg-card"
        style={{ marginRight: RIGHT_SIDEBAR_WIDTH }}
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
        initialNumToRender={10} // 首屏渲染行数
        // maxToRenderPerBatch={10} // 每批渲染的最大行数
        // windowSize={11}
        // updateCellsBatchingPeriod={30}
        getItemLayout={getItemLayout}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 0 }}
        overScrollMode="never"
      />

      <View className="absolute bottom-0 right-0 top-12 pr-2" style={{ width: RIGHT_SIDEBAR_WIDTH }}>
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
