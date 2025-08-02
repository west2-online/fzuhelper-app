import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { convertSemester } from '@/lib/locate-date';
import { LocalUser, USER_TYPE_POSTGRADUATE } from '@/lib/user';
import { JSXElementConstructor, ReactElement, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

export interface TabFlatListProps {
  data: string[]; // tab列表数据
  value: string; // 当前选中的tab值
  onChange?: (value: string) => void; // tab切换回调
  renderContent: (item: string) => ReactElement<any, string | JSXElementConstructor<any>> | null; // 渲染内容区域
  tabWidth?: number; // 单个tab的宽度
  screenWidth?: number; // 屏幕宽度
  tabsScrollViewRef?: React.RefObject<ScrollView | null>; // 外部传入的ScrollView引用
  flatListOptions?: Partial<Omit<FlatListProps<string>, 'data' | 'renderItem' | 'keyExtractor'>>; // 底部左右滑动的FlatList的配置项
}

export function TabFlatList({
  data,
  value,
  onChange,
  renderContent,
  tabWidth = 100,
  screenWidth,
  tabsScrollViewRef: externalTabsScrollViewRef,
  flatListOptions,
}: TabFlatListProps) {
  const windowDimensions = useWindowDimensions();
  const internalScreenWidth = useMemo(
    () => screenWidth ?? windowDimensions.width,
    [screenWidth, windowDimensions.width],
  );
  const internalTabsScrollViewRef = useRef<ScrollView>(null);
  const tabsScrollViewRef = externalTabsScrollViewRef || internalTabsScrollViewRef;
  const flatListRef = useRef<FlatList<any>>(null);
  const scrollX = useRef(0);

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
      const scrollTo = index * tabWidth - (internalScreenWidth / 2 - tabWidth / 2);
      tabsScrollViewRef.current.scrollTo({ x: scrollTo, animated: true });
    }
  }, [value, screenWidth, data, tabWidth, tabsScrollViewRef, internalScreenWidth]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    scrollX.current = contentOffsetX;
  };

  const handleScrollEnd = useCallback(() => {
    const index = Math.round(scrollX.current / internalScreenWidth);
    const newValue = data[Math.min(Math.max(index, 0), data.length - 1)];
    if (newValue && newValue !== value) {
      onChange?.(newValue);
    }
  }, [value, data, onChange, internalScreenWidth]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: internalScreenWidth,
      offset: internalScreenWidth * index,
      index,
    }),
    [internalScreenWidth],
  );

  return (
    <>
      <Tabs value={value} onValueChange={handleTabChange}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={tabsScrollViewRef}
          overScrollMode="never"
          bounces={false}
        >
          <TabsList className="flex-row">
            {data.map((item, index) => (
              <TabsTrigger key={index} value={item} className="items-center" style={{ width: tabWidth }}>
                <Text className="text-center">
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
        initialNumToRender={1}
        getItemLayout={getItemLayout}
        windowSize={3}
        ref={flatListRef}
        keyExtractor={(_, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => renderContent(item)}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        {...flatListOptions}
      />
    </>
  );
}
