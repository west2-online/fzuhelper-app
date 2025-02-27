import { CommonClassroomEmptyResponse_Classroom as Classroom } from '@/api/backend';
import { Text } from '@/components/ui/text';
import { useCallback, useMemo, useRef, useState } from 'react';
import { SectionList, TouchableOpacity, View, type SectionListData, type ViewToken } from 'react-native';

type Section = {
  title: string;
  data: Classroom[];
};

export default function ClassroomList({ data }: { data: Classroom[] }) {
  const sectionListRef = useRef<SectionList<Classroom, Section>>(null);
  const [currentBuild, setCurrentBuild] = useState('');

  // 按 build 分组，并对组和组内的教室进行排序
  const groupedData = useMemo(() => {
    const groups = data.reduce(
      (acc, item) => {
        acc[item.build] = acc[item.build] || [];
        acc[item.build].push(item);
        return acc;
      },
      {} as Record<string, Classroom[]>,
    );

    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));

    if (!currentBuild && sortedKeys.length > 0) {
      setCurrentBuild(sortedKeys[0]);
    }

    return sortedKeys.map(build => ({
      title: build,
      data: groups[build].sort((a, b) => a.location.localeCompare(b.location, 'zh-CN', { numeric: true })),
    }));
  }, [data, currentBuild]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<Classroom>[] }) => {
    const currentSection = viewableItems.find(item => item.section)?.section.title;
    currentSection && setCurrentBuild(currentSection);
  }, []);

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  // 立即更新状态并调整滚动定位
  const handlePress = (sectionIndex: number, sectionTitle: string) => {
    setCurrentBuild(sectionTitle); // 立即更新当前选中状态
    sectionListRef.current?.scrollToLocation({
      sectionIndex,
      // itemIndex 设置为 0 不行，只会滚动到最顶部
      // https://stackoverflow.com/questions/76311750/scrolltolocation-always-scrolling-to-top-in-sectionlist-in-react-native
      itemIndex: 1,
      animated: true,
      viewPosition: 0, // 确保分组标题贴顶
      viewOffset: 0,
    });
  };

  const renderItem = ({ item }: { item: Classroom }) => (
    <View className="border-b border-gray-200 px-4 py-3 dark:border-gray-600">
      <View className="flex-row justify-between">
        <Text className="text-base font-medium dark:text-gray-200">{item.location}</Text>
        <Text className="text-gray-500 dark:text-gray-400">{item.capacity}人</Text>
      </View>
      <Text className="mt-1 text-gray-500 dark:text-gray-400">{item.type}</Text>
    </View>
  );

  type SectionHeader = (info: { section: SectionListData<Classroom, Section> }) => React.ReactElement;
  const renderHeader: SectionHeader = ({ section }) => (
    <View className="flex-row items-center bg-white px-4 py-2 dark:bg-gray-900">
      <View className="mr-2 h-4 w-2 bg-blue-500" />
      <Text className="font-bold text-gray-700 dark:text-gray-300">{section.title}</Text>
    </View>
  );

  return (
    <View className="flex-1">
      <SectionList
        ref={sectionListRef}
        sections={groupedData}
        keyExtractor={item => item.location}
        renderItem={renderItem}
        renderSectionHeader={renderHeader}
        stickySectionHeadersEnabled
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollToIndexFailed={info => {
          console.log(`scroll failed: ${info}`);
        }}
        viewabilityConfig={viewabilityConfig}
        className="mr-20 bg-white dark:bg-gray-900"
      />
      <View className="absolute right-4 top-8">
        {groupedData.map((section, index) => (
          <TouchableOpacity key={section.title} onPress={() => handlePress(index, section.title)} className="mb-4">
            <View
              className={`px-4 py-2 ${section.title === currentBuild ? 'bg-blue-500' : 'bg-gray-300'} rounded-br-xl rounded-tr-xl`}
            >
              <Text className="text-base font-bold text-white">{section.title.substring(0, 2)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
