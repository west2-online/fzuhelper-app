/* eslint-disable react-native/no-inline-styles */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef } from 'react';
import { Image, ImageSourcePropType, Linking, TouchableOpacity, View } from 'react-native';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';

import { Text } from '@/components/ui/text';
import { pushToWebViewNormal } from '@/lib/webview';
import { useSharedValue } from 'react-native-reanimated';

export enum BannerType {
  URL = 'URL',
  Activity = 'Activity',
  NULL = 'NULL',
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
  // 宽屏阈值，默认为768
  breakpoint?: number;
  // 宽屏模式下的轮播图间隔，默认为 12
  itemSpace?: number;
};

export default function Banner({ contents, width, breakpoint = 768, itemSpace = 12, ...props }: BannerProps) {
  const isWideScreen = width >= breakpoint;
  // 根据屏幕类型决定 item 宽度
  const itemWidth = isWideScreen ? width * 0.6 : width;
  const height = itemWidth / 2.5;
  const progress = useSharedValue<number>(0);
  const isScrolling = useRef(false);

  const renderItem = useCallback(
    ({ item }: { item: BannerContent }) => (
      <TouchableOpacity
        onPress={() => {
          if (!isScrolling.current) {
            if (item.type === BannerType.URL) {
              pushToWebViewNormal(item.href);
            } else if (item.type === BannerType.Activity) {
              Linking.openURL(item.href);
            }
          }
        }}
        activeOpacity={0.7}
        style={{
          width: itemWidth,
          height: height,
        }}
        className="justify-end self-center overflow-hidden rounded-2xl"
      >
        <Image source={item.image} className="absolute h-full w-full" />

        {item.type !== BannerType.NULL && (
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.53)']}
            locations={[0, 1]}
            className="absolute z-10 w-full"
            style={{ bottom: 0 }}
          >
            <Text className="px-[10px] py-[5px] text-white">{item.text}</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    ),
    [itemWidth, height],
  );

  return (
    <View {...props}>
      <Carousel
        width={width}
        height={height}
        data={contents}
        loop
        autoPlay
        autoPlayInterval={4000}
        renderItem={renderItem}
        onProgressChange={progress}
        onScrollStart={() => {
          isScrolling.current = true;
        }}
        onScrollEnd={() => {
          isScrolling.current = false;
        }}
        mode={isWideScreen ? 'parallax' : undefined}
        modeConfig={{
          parallaxScrollingScale: 1,
          parallaxScrollingOffset: width - itemWidth - itemSpace,
        }}
      />

      <Pagination.Basic
        progress={progress}
        data={contents}
        size={6}
        containerStyle={{
          position: 'absolute',
          bottom: 8,
          right: isWideScreen ? (width - itemWidth) / 2 + 9 : 9,
          gap: 8,
        }}
        dotStyle={{
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.5)',
        }}
        activeDotStyle={{
          borderRadius: 999,
          backgroundColor: 'white',
        }}
      />
    </View>
  );
}
