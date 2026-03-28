import { memo, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  LayoutChangeEvent,
  ScrollView,
  SectionList,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type SectionListProps,
  type ViewToken,
} from 'react-native';
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
const SIDEBAR_ITEM_HEIGHT = 40;
const SIDEBAR_ITEM_GAP = 16; // matches mb-4

interface SectionListViewProps {
  chunkedGroupedData: Section[];
  insetsBottom: number;
  sectionListRef: RefObject<SectionList<SeatData[], Section>>;
  keyExtractor: (item: SeatData[], index: number) => string;
  renderItem: ({ item }: { item: SeatData[] }) => React.ReactElement;
  renderSectionHeader: ({ section }: { section: Section }) => React.ReactElement;
  onViewableItemsChanged: ({
    viewableItems,
    changed,
  }: {
    viewableItems: ViewToken<SeatData[]>[];
    changed: ViewToken<SeatData[]>[];
  }) => void;
  onScrollEndDrag: () => void;
  onScrollAnimationEnd: () => void;
  getItemLayout: SectionListProps<SeatData[], Section>['getItemLayout'];
  viewabilityConfig: NonNullable<SectionListProps<SeatData[], Section>['viewabilityConfig']>;
}

const SectionListView = memo(
  ({
    chunkedGroupedData,
    insetsBottom,
    sectionListRef,
    keyExtractor,
    renderItem,
    renderSectionHeader,
    onViewableItemsChanged,
    onScrollEndDrag,
    onScrollAnimationEnd,
    getItemLayout,
    viewabilityConfig,
  }: SectionListViewProps) => (
    <SectionList
      ref={sectionListRef}
      sections={chunkedGroupedData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      className="rounded-tr-4xl bg-card"
      style={{ marginRight: RIGHT_SIDEBAR_WIDTH }}
      stickySectionHeadersEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insetsBottom }}
      onViewableItemsChanged={onViewableItemsChanged}
      onScrollEndDrag={onScrollEndDrag}
      onScrollAnimationEnd={onScrollAnimationEnd}
      initialNumToRender={16}
      maxToRenderPerBatch={20}
      updateCellsBatchingPeriod={30}
      windowSize={11}
      removeClippedSubviews={false}
      getItemLayout={getItemLayout}
      viewabilityConfig={viewabilityConfig}
      overScrollMode="never"
    />
  ),
);

SectionListView.displayName = 'SectionListView';

interface SidebarNavProps {
  sections: Section[];
  currentArea: string;
  insetsBottom: number;
  onPress: (index: number, title: string) => void;
}

const SidebarItem = memo(({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} className="mb-4" activeOpacity={0.7}>
    <View className={cn('rounded-br-xl rounded-tr-xl px-4 py-2', isActive ? 'bg-primary' : 'bg-gray-300')}>
      <Text className="text-center text-base font-bold text-white">{title}</Text>
    </View>
  </TouchableOpacity>
));

SidebarItem.displayName = 'SidebarItem';

const SidebarNav = memo(({ sections, currentArea, insetsBottom, onPress }: SidebarNavProps) => {
  const scrollRef = useRef<ScrollView>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  const currentIndex = useMemo(
    () => sections.findIndex(section => section.title === currentArea),
    [sections, currentArea],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);

  useEffect(() => {
    if (currentIndex < 0 || containerHeight === 0) return;
    const itemFullHeight = SIDEBAR_ITEM_HEIGHT + SIDEBAR_ITEM_GAP;
    const targetY = currentIndex * itemFullHeight - (containerHeight / 2 - SIDEBAR_ITEM_HEIGHT / 2);
    scrollRef.current?.scrollTo({ y: Math.max(0, targetY), animated: true });
  }, [currentIndex, containerHeight]);

  return (
    <View className="absolute bottom-0 right-0 top-12 pr-2" style={{ width: RIGHT_SIDEBAR_WIDTH }}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insetsBottom }}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        onLayout={handleLayout}
      >
        {sections.map((section, index) => (
          <SidebarItem
            key={section.title}
            title={section.title}
            isActive={section.title === currentArea}
            onPress={() => onPress(index, section.title)}
          />
        ))}
      </ScrollView>
    </View>
  );
});

SidebarNav.displayName = 'SidebarNav';

const LearningCenterSeatsList: React.FC<LearningCenterSeatsListProps> = ({ data: fullData, onSeatPress }) => {
  const sectionListRef = useRef<SectionList<SeatData[], Section>>(null);
  const [currentArea, setCurrentArea] = useState('');
  const currentAreaRef = useRef('');
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
      const nextArea = viewableItems.find(item => item.section)?.section?.title || '';
      if (nextArea && nextArea !== currentAreaRef.current) {
        currentAreaRef.current = nextArea;
        setCurrentArea(nextArea);
      }
    },
    [],
  );

  const handlePress = useCallback((sectionIndex: number, sectionTitle: string) => {
    isAutoScrolling.current = true;
    currentAreaRef.current = sectionTitle;
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

  const keyExtractor = useCallback((item: SeatData[], index: number) => item[0]?.spaceName || `index_${index}`, []);

  const getItemLayout = useMemo(() => {
    return rnSectionListGetItemLayout({
      getItemHeight: () => SEAT_ITEM_HEIGHT,
      getSectionHeaderHeight: () => SECTION_HEADER_HEIGHT,
    });
  }, []);

  const viewabilityConfig = useMemo(() => ({ viewAreaCoveragePercentThreshold: 0 }), []);

  const handleScrollEndDrag = useCallback(() => {
    isAutoScrolling.current = false;
  }, []);

  const handleScrollAnimationEnd = useCallback(() => {
    isAutoScrolling.current = false;
  }, []);

  return (
    <View className="flex-1">
      <SectionListView
        chunkedGroupedData={chunkedGroupedData}
        insetsBottom={insets.bottom}
        sectionListRef={sectionListRef as RefObject<SectionList<SeatData[], Section>>}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        onViewableItemsChanged={handleViewableItemsChanged}
        onScrollEndDrag={handleScrollEndDrag}
        onScrollAnimationEnd={handleScrollAnimationEnd}
        getItemLayout={getItemLayout}
        viewabilityConfig={viewabilityConfig}
      />
      <SidebarNav
        sections={chunkedGroupedData}
        currentArea={currentArea}
        insetsBottom={insets.bottom}
        onPress={handlePress}
      />
    </View>
  );
};

export default memo(LearningCenterSeatsList);
