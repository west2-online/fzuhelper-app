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
  const isAutoScrolling = useRef(false);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / imageWidth);
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

  return (
    <View className='rounded-[16px] overflow-hidden'>
      <FlatList
        ref={flatListRef}
        data={contents}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              if (!isAutoScrolling.current) {
                item.onPress();
              }
            }}
            activeOpacity={0.8}   
            style={{
              width: imageWidth,
              height: imageHeight,
            }}
          >
            <Image
              source={item.image}
              className='w-full h-full'
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.53)']}
              locations={[0, 1]}
              className='absolute bottom-0 w-full'
            >
              <Text
                className='text-white px-[10px] py-[5px]'
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
