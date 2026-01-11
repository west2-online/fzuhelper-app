import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ImageSourcePropType,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  View,
} from 'react-native';

import { Text } from '@/components/ui/text';
import { pushToWebViewNormal } from '@/lib/webview';

export enum BannerType {
  URL = 'URL', // 打开网页
  Activity = 'Activity', // 跳转 activity
  NULL = 'NULL', // 无操作
}

export type BannerContent = {
  image: ImageSourcePropType;
  text: string;
} & (
  | {
      type: BannerType.URL;
      href: string;
    }
  | {
      type: BannerType.Activity;
      href: string;
    }
  | {
      type: BannerType.NULL;
    }
);

type BannerProps = React.ComponentPropsWithRef<typeof View> & {
  contents: BannerContent[];
  width: number;
};

export default function Banner({ contents, width, ...props }: BannerProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const isAutoScrolling = useRef(false);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  useEffect(() => {
    if (contents.length === 0) return; // 如果内容为空，直接返回
    const interval = setInterval(() => {
      isAutoScrolling.current = true; // 标记为正在自动滚动
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % contents.length;
        try {
          flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
          setTimeout(() => {
            isAutoScrolling.current = false; // 重置标志
          }, 300); // 延迟重置，确保状态同步
        } catch (error) {
          console.warn('scrollToIndex error:', error);
        }
        return nextIndex;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [contents.length, currentIndex]);

  const renderItem = useCallback(
    ({ item }: { item: BannerContent }) => (
      <TouchableOpacity
        onPress={() => {
          if (!isAutoScrolling.current) {
            if (item.type === BannerType.URL) {
              pushToWebViewNormal(item.href);
            } else if (item.type === BannerType.Activity) {
              Linking.openURL(item.href);
            } else if (item.type === BannerType.NULL) {
              // do nothing
            }
          }
        }}
        activeOpacity={0.7}
        style={{ width, height: width / 2.5 }}
        className="flex justify-end overflow-hidden"
      >
        {/* 图片 */}
        <Image source={item.image} resizeMode="cover" className="absolute h-full w-full" />

        {/* 底部遮罩 + 文本 */}
        {item.type !== BannerType.NULL && (
          <LinearGradient colors={['transparent', 'rgba(0, 0, 0, 0.53)']} locations={[0, 1]} className="w-full">
            <Text className="px-[10px] py-[5px] text-white">{item.text}</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    ),
    [width],
  );

  return (
    <View className="overflow-hidden rounded-[16px]" style={{ width }}>
      <FlatList
        ref={flatListRef}
        data={contents}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        overScrollMode="never"
        renderItem={renderItem}
      />

      {/* 蠕虫指示器 */}
      <View className="absolute bottom-2 right-2 flex-row items-center justify-center space-x-2">
        {contents.map((_, index) => (
          <View
            key={index}
            className={`m-1 h-1.5 w-1.5 rounded-full ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`}
          />
        ))}
      </View>
    </View>
  );
}
