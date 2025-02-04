import { ThemedView } from '@/components/ThemedView';
import Banner, { type BannerContent } from '@/components/banner';
import { Button } from '@/components/ui/button';
import { JWCH_COOKIES_KEY, JWCH_ID_KEY } from '@/lib/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, type Href, type Router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Linking, Text } from 'react-native';
import { toast } from 'sonner-native';

// 工具类型的枚举
enum ToolType {
  LINK = 'link', // 跳转路由
  URL = 'URL', // 打开网页
  FUNCTION = 'function', // 执行函数
  NULL = 'null', // 空操作
}

type Tool = {
  name: string;
  icon: any;
} & (
  | {
      type: ToolType.LINK;
      href: Href;
    }
  | {
      type: ToolType.URL;
      href: string;
    }
  | {
      type: ToolType.FUNCTION;
      action: (router: ReturnType<typeof useRouter>) => void | Promise<void>;
    }
  | {
      type: ToolType.NULL;
    }
);

// 常量：横幅数据
const DEFAULT_BANNERS: BannerContent[] = [
  { image: require('assets/images/banner/default_banner1.webp'), onPress: () => {} },
  { image: require('assets/images/banner/default_banner2.webp'), onPress: () => {} },
  { image: require('assets/images/banner/default_banner3.webp'), onPress: () => {} },
];

const DEFAULT_TOOLS: Tool[] = [
  {
    name: '学业状况',
    icon: require('assets/images/toolbox/ic_grade.png'),
    type: ToolType.LINK,
    href: '/toolbox/academic',
  },
  {
    name: '历年卷',
    icon: require('assets/images/toolbox/ic_file.png'),
    type: ToolType.LINK,
    href: '/toolbox/paper',
  },
  {
    name: '空教室',
    icon: require('assets/images/toolbox/ic_room.png'),
    type: ToolType.LINK,
    href: '/toolbox/empty-room',
  },
  {
    name: '考场查询',
    icon: require('assets/images/toolbox/ic_examroom.png'),
    type: ToolType.LINK,
    href: '/toolbox/exam-room',
  },
  {
    name: '一键评议',
    icon: require('assets/images/toolbox/ic_onekey.png'),
    type: ToolType.LINK,
    href: '/toolbox/onekey' as any, // 路由地址（不存在）
  },
  {
    name: '嘉锡讲坛',
    icon: require('assets/images/toolbox/ic_jiaxi.png'),
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
      router.push(tool.href);
      break;
    case ToolType.URL: // 打开网页
      Linking.openURL(tool.href).catch(err => Alert.alert('错误', '无法打开链接 (' + err + ')'));
      break;
    case ToolType.FUNCTION: // 执行函数，并传入 router 参数
      tool.action(router);
      break;
    default:
      toast.error('未知工具类型');
      console.error('未知工具类型', tool);
  }
};

// 工具按钮的渲染函数
const renderToolButton = ({ item }: { item: Tool }, router: Router) => (
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
