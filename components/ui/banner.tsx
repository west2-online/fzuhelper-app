import React, { useState, useEffect, useRef } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, TouchableOpacity, View, Image, ImageSourcePropType } from 'react-native';
import { Text } from './text';
import { LinearGradient } from 'expo-linear-gradient';
export interface BannerContent {
  image: ImageSourcePropType
  onPress: () => void
}

type BannerProps = React.ComponentPropsWithRef<typeof View> & {
  contents: BannerContent[]
  imageWidth: number
  imageHeight: number
}

export default function Banner({ contents, imageWidth, imageHeight, ...props }: BannerProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / imageWidth);
    // 如果手动拖拽导致的偏移与 currentIndex 不一致，则同步（iOS 侧必须，否则会出现偏移）
    if (index !== currentIndex) {
      setCurrentIndex(index);
      try {
        flatListRef.current?.scrollToIndex({ index, animated: true });
      } catch (error) {
        console.warn('scrollToIndex error:', error);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % contents.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 4000); // 每4秒滚动一次

    return () => clearInterval(interval);
  }, [contents.length]);

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <View style={{ borderRadius: 16, overflow: 'hidden' }}>
      <FlatList
        ref={flatListRef}
        data={contents}
        keyExtractor={(_, index) => index.toString()}
        initialScrollIndex={currentIndex}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={item.onPress}
            activeOpacity={0.8}
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              width: imageWidth,
              height: imageHeight,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <Image
              source={item.image}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 16,
              }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.53)']}
              locations={[0, 1]}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
              }}
            >
              <Text
                // eslint-disable-next-line react-native/no-inline-styles
                style={{ color: 'white', paddingHorizontal: 10, paddingVertical: 5 }}
              >这是一个标题</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

      />
      {/* 蠕虫指示器 */}
      <View className="absolute right-2 bottom-2 flex-row justify-center items-center space-x-2">
        {contents.map((_, index) => (
          <View
            key={index}
            className={`w-1.5 h-1.5 m-1 rounded-full ${
              currentIndex === index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </View>
    </View>
  );
}
