import { ThemedView } from '@/components/ThemedView';
import Banner, { type BannerContent } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, PixelRatio, Text } from 'react-native';

interface Tool {
  name: string;
  icon: any;
  onPress?: () => void;
}

export default function ToolsPage() {
  const [bannerList, setBannerList] = useState<BannerContent[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);

  const { width } = Dimensions.get('window');
  const bannerWidth = width - 8 * PixelRatio.get();
  const bannerHeight = bannerWidth / 2.5;

  useEffect(() => {
    // 初始化 Banner 和工具数据
    fetchBannerData();
    fetchToolData();
  }, []);

  const fetchBannerData = () => {
    const banners = [
      { image: require('assets/images/banner/default_banner1.webp'), onPress: () => {} },
      { image: require('assets/images/banner/default_banner2.webp'), onPress: () => {} },
      { image: require('assets/images/banner/default_banner3.webp'), onPress: () => {} },
    ]; // 示例
    setBannerList(banners);
  };

  const processTools = (tools: Tool[]) => {
    const len = tools.length;
    const k = len % 5; // 余数部分长度
    const mainPart = tools.slice(0, len - k); // 前 len-k 项
    const remainingPart = tools.slice(len - k); // 剩余部分

    // 调整剩余部分顺序
    const adjustedRemainingPart = [...remainingPart];

    // 填充占位符
    const times = 5 - adjustedRemainingPart.length;
    for (let i = 0; i < times; i++) {
      adjustedRemainingPart.push({
        name: '',
        icon: null,
        onPress: undefined,
      });
    }

    // 合并结果
    const result = [...mainPart, ...adjustedRemainingPart];
    return result;
  };

  const fetchToolData = () => {
    const tools = [
      {
        name: '学业状况',
        icon: require('assets/images/toolkit/ic_grade.png'),
        onPress: () => {
          console.log('使用工具【学业状况】');
        },
      },
      { name: '历年卷', icon: require('assets/images/toolkit/ic_file.png') },
      { name: '空教室', icon: require('assets/images/toolkit/ic_examroom.png') },
      { name: '考场查询', icon: require('assets/images/toolkit/ic_room.png') },
      { name: '一键评议', icon: require('assets/images/toolkit/ic_onekey.png') },
      { name: '图书馆', icon: require('assets/images/toolkit/ic_lib.png') },
      { name: '嘉锡讲坛', icon: require('assets/images/toolkit/ic_jiaxi.png') },
      // 示例数据
    ];
    setTools(processTools(tools));
  };

  return (
    <ThemedView className="m-4">
      {/* 滚动横幅 */}
      <Banner contents={bannerList} imageWidth={bannerWidth} imageHeight={bannerHeight} />
      {/* 工具区域 */}
      <FlatList
        data={tools}
        keyExtractor={(_, index) => index.toString()}
        numColumns={5}
        className="my-4"
        columnWrapperClassName="justify-between"
        renderItem={({ item }) => (
          <Button
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              width: 60, // 固定宽度
              height: 60, // 固定高度
            }}
            className="items-center justify-center bg-transparent"
            size="icon"
            onPress={item.onPress}
          >
            {item.icon ? <Image source={item.icon} className="h-12 w-12" resizeMode="contain" /> : null}
            <Text className="align-middle text-sm text-gray-700" numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
          </Button>
        )}
      />
    </ThemedView>
  );
}
