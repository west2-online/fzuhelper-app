import { CommonClassroomEmptyResponse_Classroom as Classroom } from '@/api/backend';
import { Text } from '@/components/ui/text';
import { memo, useRef, useState } from 'react';
import { SectionList, TouchableOpacity, View, type ViewToken } from 'react-native';

type Section = {
  title: string;
  data: Classroom[];
};

const ListItem = memo(function ListItem({ item }: { item: Classroom }) {
  return (
    <View className="h-16 justify-center border-b border-gray-200 px-4 dark:border-gray-600">
      <View className="flex-row justify-between">
        <Text className="text-base font-medium dark:text-gray-200">{item.location}</Text>
        <Text className="text-gray-500 dark:text-gray-400">{item.capacity}人</Text>
      </View>
      <Text className="text-gray-500 dark:text-gray-400">{item.type}</Text>
    </View>
  );
});

const buildOrder = ['西3', '西2', '西1', '中楼', '东1', '东2', '东3', '文1', '文2', '文3', '文4'];
export default function ClassroomList({ data }: { data: Classroom[] }) {
  const sectionListRef = useRef<SectionList<Classroom, Section>>(null);
  const [currentBuild, setCurrentBuild] = useState('');
  const isAutoScrolling = useRef(false);

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
      animated: true,
      viewPosition: 0, // 对齐到视口顶部
      viewOffset: 0,
    });
  };

  return (
    <View className="flex-1">
      <SectionList
        ref={sectionListRef}
        sections={groupedData}
        keyExtractor={item => item.location}
        renderItem={({ item }) => <ListItem item={item} />}
        renderSectionHeader={({ section }) => (
          <View className="flex-row items-center bg-white px-4 py-2 dark:bg-gray-900">
            <View className="mr-2 h-4 w-2 bg-blue-500" />
            <Text className="font-bold text-gray-700 dark:text-gray-300">{section.title}</Text>
          </View>
        )}
        stickySectionHeadersEnabled
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollEndDrag={() => {
          isAutoScrolling.current = false;
        }}
        onScrollAnimationEnd={() => {
          isAutoScrolling.current = false;
        }}
        getItemLayout={(_, index) => {
          if (index === -1) return { index, length: 0, offset: 0 };
          return {
            index: index,
            length: 56, // h-16
            offset: 56 * index,
          };
        }}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 0 }}
        className="mr-20 bg-white dark:bg-gray-900"
      />

      {/* 右侧书签导航 */}
      <View className="absolute right-4 top-8">
        {groupedData.map((section, index) => (
          <TouchableOpacity key={section.title} onPress={() => handlePress(index, section.title)} className="mb-4">
            <View
              className={`px-4 py-2 ${
                section.title === currentBuild ? 'bg-blue-500' : 'bg-gray-300'
              } rounded-br-xl rounded-tr-xl`}
            >
              <Text className="text-base font-bold text-white">{section.title.substring(0, 2)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
