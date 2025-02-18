import BannerImage1 from '@/assets/images/banner/default_banner1.webp';
import BannerImage2 from '@/assets/images/banner/default_banner2.webp';
import BannerImage3 from '@/assets/images/banner/default_banner3.webp';
import ExamRoomIcon from '@/assets/images/toolbox/ic_examroom.png';
import FileIcon from '@/assets/images/toolbox/ic_file.png';
import GradeIcon from '@/assets/images/toolbox/ic_grade.png';
import JiaXiIcon from '@/assets/images/toolbox/ic_jiaxi.png';
import OneKeyIcon from '@/assets/images/toolbox/ic_onekey.png';
import RoomIcon from '@/assets/images/toolbox/ic_room.png';
import { ThemedView } from '@/components/ThemedView';
import Banner, { type BannerContent } from '@/components/banner';
import { Button } from '@/components/ui/button';
import { Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Linking, Text } from 'react-native';
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
  { image: BannerImage1, onPress: () => {} },
  { image: BannerImage2, onPress: () => {} },
  { image: BannerImage3, onPress: () => {} },
];

// 常量：工具数据
const DEFAULT_TOOLS: Tool[] = [
  {
    name: '学业状况',
    icon: GradeIcon,
    type: ToolType.LINK,
    data: '/toolbox/academic',
  },
  {
    name: '历年卷',
    icon: FileIcon,
    type: ToolType.LINK,
    data: '/toolbox/paper',
  },
  {
    name: '空教室',
    icon: RoomIcon,
    type: ToolType.LINK,
    data: '/toolbox/empty-room',
  },
  {
    name: '考场查询',
    icon: ExamRoomIcon,
    type: ToolType.LINK,
    data: '/toolbox/exam-room',
  },
  {
    name: '一键评议',
    icon: OneKeyIcon,
    type: ToolType.LINK,
    data: '/toolbox/onekey', // 路由地址
  },
  {
    name: '嘉锡讲坛',
    icon: JiaXiIcon,
    type: ToolType.FUNCTION,
    action: async router => {
      router.push({
        pathname: '/web',
        params: {
          title: '嘉熙讲坛',
          url:
            'https://jwcjwxt2.fzu.edu.cn:81/student/glbm/lecture/jxjt_cszt.aspx?id=' +
            (await AsyncStorage.getItem(JWCH_ID_KEY)),
          jwchCookie: (await AsyncStorage.getItem(JWCH_COOKIES_KEY)) ?? undefined,
        },
      });
    },
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
    className="mb-3 h-auto w-auto items-center justify-center bg-transparent"
    size="icon"
    onPress={() => toolOnPress(item, router)}
  >
    {item.icon ? <Image source={item.icon} className="h-12 w-12" resizeMode="contain" /> : null}
    <Text className="w-[50px] text-center align-middle text-sm text-foreground" numberOfLines={1} ellipsizeMode="tail">
      {item.name}
    </Text>
  </Button>
);

export default function ToolsPage() {
  const { bannerList, toolList } = useToolsPageData();
  const router = useRouter();

  return (
    <ThemedView className="m-6">
      {/* 滚动横幅 */}
      <Banner contents={bannerList} />

      {/* 工具区域 */}
      <FlatList
        data={toolList}
        keyExtractor={(_, index) => index.toString()}
        numColumns={5}
        className="mt-4"
        columnWrapperClassName="justify-between"
        renderItem={({ item }) => renderToolButton({ item }, router)}
      />
    </ThemedView>
  );
}
