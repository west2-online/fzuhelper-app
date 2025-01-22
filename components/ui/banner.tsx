import React, { useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, TouchableOpacity, View, Image, ImageSourcePropType } from 'react-native';

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / imageWidth);
    setCurrentIndex(index);
  };

  return (
    <View>
      <FlatList
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
            className="justify-center items-center"
            style={{ width: imageWidth, height: imageHeight }}
          >
            <Image
              source={ item.image }
              className="size-full"
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

      />
      {/* 蠕虫指示器 */}
      <View className="absolute right-3 bottom-3 flex-row justify-center items-center space-x-2">
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
