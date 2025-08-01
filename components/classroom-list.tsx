import { memo, useCallback, useRef, useState } from 'react';
import { ScrollView, SectionList, TouchableOpacity, View, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

import { CommonClassroomEmptyResponse_Classroom as Classroom } from '@/api/backend';
import rnSectionListGetItemLayout from '@/utils/rn-section-list-get-item-layout';
import React from 'react';

interface Section {
  title: string;
  data: Classroom[];
}

interface ListItemProps {
  item: Classroom;
}

const SECTION_HEADER_HEIGHT = 40; // 段落标题高度
const LIST_ITEM_HEIGHT = 56; // 列表项高度

const SectionHeader = React.memo(({ title }: { title: string }) => (
  <View className="flex-row items-center bg-card" style={{ height: SECTION_HEADER_HEIGHT }}>
    <View className="mr-2 h-5 w-2 bg-primary" />
    <Text className="font-bold text-primary">{title}</Text>
  </View>
));

SectionHeader.displayName = 'SectionHeader';

const ListItem = React.memo<ListItemProps>(({ item }) => (
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

function ClassroomList({ data }: { data: Classroom[] }) {
  const sectionListRef = useRef<SectionList<Classroom, Section>>(null);
  const [currentBuild, setCurrentBuild] = useState('');
  const isAutoScrolling = useRef(false);
  const insets = useSafeAreaInsets();

  const groups = data.reduce(
    (acc, item) => {
      acc[item.build] = acc[item.build] || [];
      acc[item.build].push(item);
      return acc;
    },
    {} as Record<string, Classroom[]>,
  );
  const sortedKeys = Object.keys(groups).sort((a, b) => buildOrder.indexOf(a) - buildOrder.indexOf(b));
  const groupedData = sortedKeys.map(build => ({
    title: build,
    data: groups[build].sort((a, b) => a.location.localeCompare(b.location, 'zh-CN', { numeric: true })),
  }));

  const onViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken<Classroom>[];
    changed: ViewToken<Classroom>[];
  }) => {
    if (isAutoScrolling.current) return;
    const sectionIndexList = viewableItems
      .filter(item => item.section !== null)
      .map(item => item.section as Section)
      .map(section => sortedKeys.indexOf(section.title));
    let currentSectionIndex = Math.min(...sectionIndexList);
    setCurrentBuild(groupedData[currentSectionIndex]?.title);
  };

  const handlePress = (sectionIndex: number, sectionTitle: string) => {
    isAutoScrolling.current = true;
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
  };

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => <SectionHeader title={section.title} />,
    [],
  );

  const renderListItem = useCallback(({ item }: { item: Classroom }) => <ListItem item={item} />, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => {
      return rnSectionListGetItemLayout({
        getItemHeight: () => LIST_ITEM_HEIGHT,
        getSectionHeaderHeight: () => SECTION_HEADER_HEIGHT,
      })(groupedData, index);
    },
    [groupedData],
  );

  return (
    <View className="flex-1">
      <SectionList
        className="mr-20 rounded-tr-4xl bg-card"
        ref={sectionListRef}
        sections={groupedData}
        keyExtractor={item => item.location}
        renderItem={renderListItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollEndDrag={() => {
          isAutoScrolling.current = false;
        }}
        onScrollAnimationEnd={() => {
          isAutoScrolling.current = false;
        }}
        getItemLayout={getItemLayout}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 0 }}
        initialNumToRender={16}
        overScrollMode="never"
      />

      {/* 右侧书签导航 */}
      <View className="absolute bottom-0 right-4 top-12">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom }}>
          {groupedData.map((section, index) => (
            <TouchableOpacity
              key={section.title}
              onPress={() => handlePress(index, section.title)}
              className="mb-4"
              activeOpacity={0.7}
            >
              <View
                className={`px-4 py-2 ${
                  section.title === currentBuild ? 'bg-primary' : 'bg-gray-300'
                } rounded-br-xl rounded-tr-xl`}
              >
                <Text className="text-base font-bold text-white">{section.title.substring(0, 2)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

export default memo(ClassroomList);
