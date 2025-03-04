import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { convertSemester } from '@/lib/locate-date';
import { LocalUser, USER_TYPE_POSTGRADUATE } from '@/lib/user';
import { JSXElementConstructor, ReactElement, useCallback, useEffect, useRef } from 'react';
import { Dimensions, FlatList, ScrollView } from 'react-native';

export interface TabFlatListProps {
  data: string[]; // tab列表数据
  value: string; // 当前选中的tab值
  onChange?: (value: string) => void; // tab切换回调
  renderContent: (item: string) => ReactElement<any, string | JSXElementConstructor<any>> | null; // 渲染内容区域
  tabWidth?: number; // 单个tab的宽度
  screenWidth?: number; // 屏幕宽度
  tabsScrollViewRef?: React.RefObject<ScrollView>; // 外部传入的ScrollView引用
}

export function TabFlatList({
  data,
  value,
  onChange,
  renderContent,
  tabWidth = 96,
  screenWidth = Dimensions.get('window').width,
  tabsScrollViewRef: externalTabsScrollViewRef,
}: TabFlatListProps) {
  const internalTabsScrollViewRef = useRef<ScrollView>(null);
  const tabsScrollViewRef = externalTabsScrollViewRef || internalTabsScrollViewRef;
  const flatListRef = useRef<FlatList<any>>(null);

  // 处理 flatList 滚动
  const handleTabChange = (newValue: string) => {
    onChange?.(newValue);
    const index = data.findIndex(item => item === newValue);
    if (flatListRef.current && index > -1) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  // 当value改变时，更新Tabs的ScrollView滚动位置
  useEffect(() => {
    const index = data.findIndex(item => item === value);
    if (tabsScrollViewRef.current && index > -1) {
      const scrollTo = index * tabWidth - (screenWidth / 2 - tabWidth / 2);
      tabsScrollViewRef.current.scrollTo({ x: scrollTo, animated: true });
    }
  }, [value, screenWidth, data, tabWidth, tabsScrollViewRef]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        const newValue = viewableItems[0].item;
        if (newValue !== value) {
          onChange?.(newValue);
        }
      }
    },
    [value, onChange],
  );

  return (
    <>
      <Tabs value={value} onValueChange={handleTabChange}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} ref={tabsScrollViewRef}>
          <TabsList className="flex-row">
            {data.map((item, index) => (
              <TabsTrigger key={index} value={item} className="items-center">
                <Text className="w-24 text-center">
                  {LocalUser.getUser().type === USER_TYPE_POSTGRADUATE ? convertSemester(item) : item}
                </Text>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollView>
      </Tabs>

      <FlatList
        data={data}
        horizontal
        pagingEnabled
        windowSize={3}
        ref={flatListRef}
        keyExtractor={(_, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => renderContent(item)}
        onScrollToIndexFailed={() => {}}
      />
    </>
  );
}
