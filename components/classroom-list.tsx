import { memo, useCallback, useMemo, useRef, useState, type RefObject } from 'react';
import { ScrollView, SectionList, TouchableOpacity, View, type SectionListProps, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

import { CommonClassroomEmptyResponse_Classroom as Classroom } from '@/api/backend';
import rnSectionListGetItemLayout from '@/utils/rn-section-list-get-item-layout';

interface Section {
  title: string;
  data: Classroom[];
}

const SECTION_HEADER_HEIGHT = 40; // 段落标题高度
const LIST_ITEM_HEIGHT = 56; // 列表项高度

const SectionHeader = memo(({ title }: { title: string }) => (
  <View className="flex-row items-center bg-card" style={{ height: SECTION_HEADER_HEIGHT }}>
    <View className="mr-2 h-5 w-2 bg-primary" />
    <Text className="font-bold text-primary">{title}</Text>
  </View>
));

SectionHeader.displayName = 'SectionHeader';

const ListItem = memo(({ item }: { item: Classroom }) => (
  <View className="justify-center border-b border-border px-4" style={{ height: LIST_ITEM_HEIGHT }}>
    <View className="flex-row justify-between">
      <Text className="text-base font-medium">{item.location}</Text>
      <Text className="text-text-secondary">{item.capacity}人</Text>
    </View>
    <Text className="text-text-secondary">{item.type}</Text>
  </View>
));

ListItem.displayName = 'ListItem';

const buildOrder = ['西3', '西2', '西1', '中楼', '东1', '东2', '东3', '文1', '文2', '文3', '文4'];

interface SectionListViewProps {
  groupedData: Section[];
  insetsBottom: number;
  sectionListRef: RefObject<SectionList<Classroom, Section>>;
  keyExtractor: (item: Classroom) => string;
  renderListItem: ({ item }: { item: Classroom }) => React.ReactElement;
  renderSectionHeader: ({ section }: { section: Section }) => React.ReactElement;
  onViewableItemsChanged: ({
    viewableItems,
    changed,
  }: {
    viewableItems: ViewToken<Classroom>[];
    changed: ViewToken<Classroom>[];
  }) => void;
  onScrollEndDrag: () => void;
  onScrollAnimationEnd: () => void;
  getItemLayout: SectionListProps<Classroom, Section>['getItemLayout'];
  viewabilityConfig: NonNullable<SectionListProps<Classroom, Section>['viewabilityConfig']>;
}

const SectionListView = memo(
  ({
    groupedData,
    insetsBottom,
    sectionListRef,
    keyExtractor,
    renderListItem,
    renderSectionHeader,
    onViewableItemsChanged,
    onScrollEndDrag,
    onScrollAnimationEnd,
    getItemLayout,
    viewabilityConfig,
  }: SectionListViewProps) => (
    <SectionList
      className="mr-20 rounded-tr-4xl bg-card"
      ref={sectionListRef}
      sections={groupedData}
      keyExtractor={keyExtractor}
      renderItem={renderListItem}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: insetsBottom,
      }}
      onViewableItemsChanged={onViewableItemsChanged}
      onScrollEndDrag={onScrollEndDrag}
      onScrollAnimationEnd={onScrollAnimationEnd}
      getItemLayout={getItemLayout}
      viewabilityConfig={viewabilityConfig}
      initialNumToRender={24}
      maxToRenderPerBatch={24}
      updateCellsBatchingPeriod={30}
      windowSize={11}
      removeClippedSubviews={false}
      overScrollMode="never"
    />
  ),
);

SectionListView.displayName = 'SectionListView';

interface SidebarNavProps {
  sections: Section[];
  currentBuild: string;
  insetsBottom: number;
  onPress: (index: number, title: string) => void;
}

const SidebarItem = memo(({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} className="mb-4" activeOpacity={0.7}>
    <View className={`px-4 py-2 ${isActive ? 'bg-primary' : 'bg-gray-300'} rounded-br-xl rounded-tr-xl`}>
      <Text className="text-base font-bold text-white">{title.substring(0, 2)}</Text>
    </View>
  </TouchableOpacity>
));

SidebarItem.displayName = 'SidebarItem';

const SidebarNav = memo(({ sections, currentBuild, insetsBottom, onPress }: SidebarNavProps) => (
  <View className="absolute bottom-0 right-4 top-12">
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insetsBottom }}>
      {sections.map((section, index) => (
        <SidebarItem
          key={section.title}
          title={section.title}
          isActive={section.title === currentBuild}
          onPress={() => onPress(index, section.title)}
        />
      ))}
    </ScrollView>
  </View>
));

SidebarNav.displayName = 'SidebarNav';

function ClassroomList({ data }: { data: Classroom[] }) {
  const sectionListRef = useRef<SectionList<Classroom, Section>>(null);
  const [currentBuild, setCurrentBuild] = useState('');
  const currentBuildRef = useRef('');
  const isAutoScrolling = useRef(false);
  const insets = useSafeAreaInsets();

  const groupedData = useMemo(() => {
    const groups = data.reduce(
      (acc, item) => {
        acc[item.build] = acc[item.build] || [];
        acc[item.build].push(item);
        return acc;
      },
      {} as Record<string, Classroom[]>,
    );
    const nextSortedKeys = Object.keys(groups).sort((a, b) => buildOrder.indexOf(a) - buildOrder.indexOf(b));
    return nextSortedKeys.map(build => ({
      title: build,
      data: groups[build].sort((a, b) => a.location.localeCompare(b.location, 'zh-CN', { numeric: true })),
    }));
  }, [data]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Classroom>[]; changed: ViewToken<Classroom>[] }) => {
      if (isAutoScrolling.current) return;
      const nextBuild = viewableItems.find(item => item.section)?.section?.title || '';
      if (nextBuild && nextBuild !== currentBuildRef.current) {
        currentBuildRef.current = nextBuild;
        setCurrentBuild(nextBuild);
      }
    },
    [],
  );

  const handlePress = useCallback((sectionIndex: number, sectionTitle: string) => {
    isAutoScrolling.current = true;
    currentBuildRef.current = sectionTitle;
    setCurrentBuild(sectionTitle);

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

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => <SectionHeader title={section.title} />,
    [],
  );

  const renderListItem = useCallback(({ item }: { item: Classroom }) => <ListItem item={item} />, []);

  const keyExtractor = useCallback((item: Classroom) => item.location, []);

  const viewabilityConfig = useMemo(() => ({ viewAreaCoveragePercentThreshold: 0 }), []);

  const handleScrollEndDrag = useCallback(() => {
    isAutoScrolling.current = false;
  }, []);

  const handleScrollAnimationEnd = useCallback(() => {
    isAutoScrolling.current = false;
  }, []);

  const getItemLayout = useMemo(
    () =>
      rnSectionListGetItemLayout({
        getItemHeight: () => LIST_ITEM_HEIGHT,
        getSectionHeaderHeight: () => SECTION_HEADER_HEIGHT,
      }),
    [],
  );

  return (
    <View className="flex-1">
      <SectionListView
        groupedData={groupedData}
        insetsBottom={insets.bottom}
        sectionListRef={sectionListRef as RefObject<SectionList<Classroom, Section>>}
        keyExtractor={keyExtractor}
        renderListItem={renderListItem}
        renderSectionHeader={renderSectionHeader}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollEndDrag={handleScrollEndDrag}
        onScrollAnimationEnd={handleScrollAnimationEnd}
        getItemLayout={getItemLayout}
        viewabilityConfig={viewabilityConfig}
      />

      <SidebarNav
        sections={groupedData}
        currentBuild={currentBuild}
        insetsBottom={insets.bottom}
        onPress={handlePress}
      />
    </View>
  );
}

export default memo(ClassroomList);
