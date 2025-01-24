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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / imageWidth);
    setCurrentIndex(index);
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
    <View>
      <FlatList
        ref={flatListRef}
        data={contents}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={item.onPress} 
            activeOpacity={0.8}
            className="justify-center items-center rounded-xl overflow-hidden" // 给FlatList设置圆角无效果，退求其次
            style={{ width: imageWidth, height: imageHeight }}
          >
            <Image
              source={ item.image }
              className="size-full"
              resizeMode="cover"
            />
             <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.53)']}
              locations={[0, 1]}
              className="absolute bottom-0 w-full"
            >
              <Text className="text-white text-base px-2.5 py-1.5">这是一个标题</Text>
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
