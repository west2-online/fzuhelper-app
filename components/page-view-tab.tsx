import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import PagerView from 'react-native-pager-view';

export interface PagerViewTabProps {
  data: string[]; // tab 数据
  value: string; // 当前选中的 tab 值
  onChange?: (value: string) => void; // tab 切换回调
  renderContent: (item: string) => React.ReactNode; // 渲染内容区域
  tabWidth?: number; // 单个 tab 的宽度
  screenWidth?: number; // 屏幕宽度
}

export function PagerViewTab({
  data,
  value,
  onChange,
  renderContent,
  tabWidth = 96,
  screenWidth = Dimensions.get('window').width,
}: PagerViewTabProps) {
  const [currentIndex, setCurrentIndex] = useState(data.findIndex(item => item === value) || 0);
  const pagerViewRef = useRef<PagerView>(null);

  // 处理 tab 点击切换
  const handleTabChange = (newValue: string) => {
    const index = data.findIndex(item => item === newValue);
    if (index > -1) {
      setCurrentIndex(index);
      pagerViewRef.current?.setPage(index);
      onChange?.(newValue);
    }
  };

  // 处理 PagerView 滑动切换
  const handlePageSelected = (event: any) => {
    const index = event.nativeEvent.position;
    setCurrentIndex(index);
    onChange?.(data[index]);
  };

  return (
    <View className="flex-1">
      {/* Tabs Header */}
      <Tabs value={data[currentIndex]} onValueChange={handleTabChange}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} overScrollMode="never" bounces={false}>
          <TabsList className="flex-row">
            {data.map((item, index) => (
              <TabsTrigger key={index} value={item} className="items-center" style={{ width: tabWidth }}>
                <Text className="text-center">{item}</Text>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollView>
      </Tabs>

      {/* PagerView for Content */}
      <PagerView ref={pagerViewRef} className="flex-1" initialPage={currentIndex} onPageSelected={handlePageSelected}>
        {data.map((item, index) => (
          <View key={index} style={{ width: screenWidth }} className="flex-1">
            {renderContent(item)}
          </View>
        ))}
      </PagerView>
    </View>
  );
}
