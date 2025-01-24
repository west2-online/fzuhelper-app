import { ThemedView } from '@/components/ThemedView';
import Banner, { type BannerContent } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, Linking, PixelRatio, Text } from 'react-native';
import { toast } from 'sonner-native';

// 工具类型的枚举
enum ToolType {
  LINK = 'link', // 跳转路由
  URL = 'URL', // 打开网页
  NULL = 'null', // 空操作
}

// 定义工具数据的结构
interface Tool {
  name: string; // 名称
  icon: any; // 图标
  type: ToolType; // 工具类型
  data: string; // 附加数据（如路由地址或其他信息）
}

// 常量：横幅数据
const DEFAULT_BANNERS: BannerContent[] = [
  { image: require('assets/images/banner/default_banner1.webp'), onPress: () => {} },
  { image: require('assets/images/banner/default_banner2.webp'), onPress: () => {} },
  { image: require('assets/images/banner/default_banner3.webp'), onPress: () => {} },
];

// 常量：工具数据
const DEFAULT_TOOLS: Tool[] = [
  {
    name: '学业状况',
    icon: require('assets/images/toolbox/ic_grade.png'),
    type: ToolType.LINK,
    data: '/toolbox/academic',
  },
  {
    name: '历年卷',
    icon: require('assets/images/toolbox/ic_file.png'),
    type: ToolType.LINK,
    data: '/(root)/toolbox/paper',
  },
  {
    name: '空教室',
    icon: require('assets/images/toolbox/ic_examroom.png'),
    type: ToolType.LINK,
    data: '/(root)/toolbox/empty-room',
  },
  {
    name: '考场查询',
    icon: require('assets/images/toolbox/ic_room.png'),
    type: ToolType.LINK,
    data: '/(root)/toolbox/exam-room',
  },
  // {
  //   name: '一键评议',
  //   icon: require('assets/images/toolbox/ic_onekey.png'),
  //   type: ToolType.LINK,
  //   data: '/(root)/toolbox/onekey', // 路由地址
  // },
  {
    name: '嘉锡讲坛',
    icon: require('assets/images/toolbox/ic_jiaxi.png'),
    type: ToolType.LINK,
    data: '/(root)/toolbox/jiaxi-lecture', // 自定义操作标识
  },
];

// 工具函数：处理工具数据，按 5 的倍数填充占位符
const processTools = (tools: Tool[]) => {
  const remainder = tools.length % 5;
  if (remainder === 0) return tools; // 不需要填充

  const placeholders = Array(5 - remainder).fill({
    name: '',
    icon: null,
    type: ToolType.NULL,
    data: '',
  });
  return [...tools, ...placeholders];
};

// 自定义 Hook：管理横幅和工具数据
const useToolsPageData = () => {
  const [bannerList, setBannerList] = useState<BannerContent[]>([]);
  const [toolList, setToolList] = useState<Tool[]>([]);

  useEffect(() => {
    // 模拟数据加载
    setBannerList(DEFAULT_BANNERS);
    setToolList(processTools(DEFAULT_TOOLS));
  }, []);

  return { bannerList, toolList };
};

// 工具按钮的点击事件
const toolOnPress = (tool: Tool, router: ReturnType<typeof useRouter>) => {
  switch (tool.type) {
    case ToolType.NULL: // 空操作
      break;
    case ToolType.LINK: // 跳转路由
      router.push(tool.data as Href);
      break;
    case ToolType.URL: // 打开网页
      Linking.openURL(tool.data).catch(err => Alert.alert('错误', '无法打开链接(' + err + ')'));
      break;
    default:
      toast.error('未知工具类型: ' + tool.type);
      console.warn('未知工具类型:', tool.type);
  }
};

// 工具按钮的渲染函数
const renderToolButton = ({ item }: { item: Tool }, router: ReturnType<typeof useRouter>) => (
  <Button
    // eslint-disable-next-line react-native/no-inline-styles
    style={{
      width: 60, // 固定宽度
      height: 60, // 固定高度
    }}
    className="items-center justify-center bg-transparent"
    size="icon"
    onPress={() => toolOnPress(item, router)}
  >
    {item.icon ? <Image source={item.icon} className="h-12 w-12" resizeMode="contain" /> : null}
    <Text className="align-middle text-sm text-gray-700" numberOfLines={1} ellipsizeMode="tail">
      {item.name}
    </Text>
  </Button>
);

export default function ToolsPage() {
  const { bannerList, toolList } = useToolsPageData();
  const router = useRouter();

  const { width } = Dimensions.get('window');
  const bannerWidth = width - 12 * PixelRatio.get();
  const bannerHeight = bannerWidth / 2.5;

  return (
    <ThemedView className="m-6">
      {/* 滚动横幅 */}
      <Banner contents={bannerList} imageWidth={bannerWidth} imageHeight={bannerHeight} />
      {/* 工具区域 */}
      <FlatList
        data={toolList}
        keyExtractor={(_, index) => index.toString()}
        numColumns={5}
        className="my-4"
        columnWrapperClassName="justify-between"
        renderItem={({ item }) => renderToolButton({ item }, router)}
      />
    </ThemedView>
  );
}
