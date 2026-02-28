import { type Href, useRouter } from 'expo-router';
import { forwardRef, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Platform, Pressable, useWindowDimensions, View } from 'react-native';

import BannerImage1 from '@/assets/images/banner/default_banner1.webp';
import BannerImage2 from '@/assets/images/banner/default_banner2.webp';
import BannerImage3 from '@/assets/images/banner/default_banner3.webp';
import ApartmentIcon from '@/assets/images/toolbox/ic_apartment.svg';
import ApplicationIcon from '@/assets/images/toolbox/ic_application.svg';
import ElectroCarIcon from '@/assets/images/toolbox/ic_electrocar.svg';
import ExamRoomIcon from '@/assets/images/toolbox/ic_examroom.svg';
import FileIcon from '@/assets/images/toolbox/ic_file.svg';
import GradeIcon from '@/assets/images/toolbox/ic_grade.svg';
import GraduationIcon from '@/assets/images/toolbox/ic_graduation.svg';
import JiaXiIcon from '@/assets/images/toolbox/ic_jiaxi.svg';
import LostFoundIcon from '@/assets/images/toolbox/ic_lostandfound.svg';
import MoreIcon from '@/assets/images/toolbox/ic_more.svg';
import NotificationIcon from '@/assets/images/toolbox/ic_notification.svg';
import OneKeyIcon from '@/assets/images/toolbox/ic_onekey.svg';
import RoomIcon from '@/assets/images/toolbox/ic_room.svg';
import FZURunIcon from '@/assets/images/toolbox/ic_run.svg';
import UtilityPaymentIcon from '@/assets/images/toolbox/ic_shuidian.svg';
import IDCardIcon from '@/assets/images/toolbox/ic_studentcard.svg';
import StudyCenterIcon from '@/assets/images/toolbox/ic_studycenter.svg';
import WikiIcon from '@/assets/images/toolbox/ic_wiki.svg';
import XiaoBenIcon from '@/assets/images/toolbox/ic_xiaobenhua.svg';
import XuankeIcon from '@/assets/images/toolbox/ic_xuanke.svg';
import ZHCTIcon from '@/assets/images/toolbox/ic_zhct.svg';
import FreeFriendsIcon from '@/assets/images/toolbox/ic_free_friends.svg';
import Banner, { type BannerContent, BannerType } from '@/components/banner';
import PageContainer from '@/components/page-container';
import { Button, ButtonProps } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { showIgnorableAlert } from '@/lib/common-settings';

import { LocalUser, USER_TYPE_UNDERGRADUATE } from '@/lib/user';
import { pushToWebViewSSO } from '@/lib/webview';
import { isToolboxTool, ToolboxTool, toolOnPress, ToolType, UserType } from '@/utils/tools';

import { LaunchScreenScreenResponse } from '@/api/backend';
import { getApiV1LaunchScreenScreen, getApiV1ToolboxConfig } from '@/api/generate';
import useApiRequest from '@/hooks/useApiRequest';
import { EXPIRE_ONE_DAY, TOOLBOX_BANNER_KEY, TOOLBOX_CONFIG_KEY } from '@/lib/constants';
import DeviceInfo from 'react-native-device-info';
import { toast } from 'sonner-native';

// 工具类型的枚举

// 常量：横幅数据
const DEFAULT_BANNERS: BannerContent[] = [
  { image: BannerImage1, text: '', type: BannerType.NULL },
  { image: BannerImage2, text: '', type: BannerType.NULL },
  { image: BannerImage3, text: '', type: BannerType.NULL },
];

// 工具id手写而不采用数组下标，是为了避免版本迭代功能增删后特定功能的下标发生改变导致配置不对应
// 后续新增功能时，id不得使用已存在或曾经存在的功能id
const DEFAULT_TOOLS: ToolboxTool[] = [
  {
    id: 10,
    name: '学业状况',
    icon: GradeIcon,
    type: ToolType.LINK,
    href: '/toolbox/academic',
  },
  {
    id: 20,
    name: '教务通知',
    icon: NotificationIcon,
    type: ToolType.LINK,
    href: '/toolbox/office-notice',
    userTypes: [USER_TYPE_UNDERGRADUATE],
  },
  {
    id: 30,
    name: '历年卷',
    icon: FileIcon,
    type: ToolType.LINK,
    href: '/toolbox/paper',
  },
  {
    id: 40,
    name: '空教室',
    icon: RoomIcon,
    type: ToolType.LINK,
    href: '/toolbox/empty-room',
  },
  {
    id: 50,
    name: '考场查询',
    icon: ExamRoomIcon,
    type: ToolType.LINK,
    href: '/toolbox/exam-room',
  },
  {
    id: 60,
    name: '一键评议',
    icon: OneKeyIcon,
    type: ToolType.LINK,
    href: '/toolbox/onekey-comment',
  },
  {
    id: 70,
    name: '选课',
    icon: XuankeIcon,
    type: ToolType.LINK,
    href: '/toolbox/xuanke',
    userTypes: [USER_TYPE_UNDERGRADUATE],
  },
  {
    id: 80,
    name: '各类申请',
    icon: ApplicationIcon,
    type: ToolType.LINK,
    href: '/toolbox/application',
    userTypes: [USER_TYPE_UNDERGRADUATE],
  },
  {
    id: 90,
    name: '学生证',
    icon: IDCardIcon,
    type: ToolType.LINK,
    href: '/toolbox/id-card',
    userTypes: [USER_TYPE_UNDERGRADUATE],
  },
  {
    id: 100,
    name: '毕业设计',
    icon: GraduationIcon,
    type: ToolType.LINK,
    href: '/toolbox/graduation',
    userTypes: [USER_TYPE_UNDERGRADUATE],
  },
  {
    id: 110,
    name: '嘉锡讲坛',
    icon: JiaXiIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glbm/lecture/jxjt_cszt.aspx',
      title: '嘉锡讲坛',
      jwch: true,
    },
    userTypes: [USER_TYPE_UNDERGRADUATE],
  },
  {
    id: 120,
    name: '智慧餐厅',
    icon: ZHCTIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://hqczhct.fzu.edu.cn:8001/html/index.html',
      title: '智慧餐厅',
    },
  },
  {
    id: 130,
    name: '校园指南',
    icon: WikiIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://fzuwiki.west2.online/?source=fzuhelper&utm_source=fzuhelper-app&utm_medium=toolbox',
      title: '校园指南',
    },
  },
  {
    id: 140,
    name: '飞跃手册',
    icon: FZURunIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://run.west2.online/?source=fzuhelper&utm_source=fzuhelper-app&utm_medium=toolbox',
      title: '飞跃手册',
    },
  },
  {
    id: 150,
    name: '学习中心',
    icon: StudyCenterIcon,
    type: ToolType.LINK,
    href: '/toolbox/learning-center',
  },
  {
    id: 160,
    name: '公寓报修',
    icon: ApartmentIcon,
    type: ToolType.FUNCTION,
    action: async () => {
      // 使用可忽略的提示
      await showIgnorableAlert(
        'apartment_repair_permission', // 提示的唯一标识符
        '权限提示',
        '公寓报修需要上传图片或拍照，如果无法拍照/图片无法上传，请检查是否已授予相机/相册权限',
        // 被忽略时直接执行的操作
        () => pushToWebViewSSO('http://ehall.fzu.edu.cn/ssfw/sys/swmssbxapp/*default/index.do', '公寓报修'),
        // 普通按钮
        [
          {
            text: '暂不打开',
            style: 'cancel',
          },
          {
            text: '打开',
            onPress: () => {
              pushToWebViewSSO('http://ehall.fzu.edu.cn/ssfw/sys/swmssbxapp/*default/index.do', '公寓报修');
            },
          },
        ],
        { cancelable: true },
      );
    },
  },
  {
    id: 170,
    name: '电动车',
    icon: ElectroCarIcon,
    type: ToolType.FUNCTION,
    action: async () => {
      // 使用可忽略的提示
      await showIgnorableAlert(
        'electrocar_network_tip', // 提示的唯一标识符
        '网络提示',
        '电动车管理页面需要较好的校园网环境，可能会加载较慢或无法打开，如果遇到问题请尝试切换网络环境',
        // 被忽略时直接执行的操作
        () => pushToWebViewSSO('http://doorwxoa.fzu.edu.cn/appCas/index', '电动车管理'),
        // 普通按钮
        [
          {
            text: '暂不打开',
            style: 'cancel',
          },
          {
            text: '打开',
            onPress: () => {
              pushToWebViewSSO('http://doorwxoa.fzu.edu.cn/appCas/index', '电动车管理');
            },
          },
        ],
        { cancelable: true },
      );
    },
  },
  {
    id: 180,
    name: '校本化',
    icon: XiaoBenIcon,
    type: ToolType.FUNCTION,
    action: async () => {
      // 使用可忽略的提示
      await showIgnorableAlert(
        'yiban_location_tip', // 提示的唯一标识符
        '定位权限提示',
        '我们注意到，由于易班系统原因，在一些设备上无法实现定位签到功能，如果遇到此类问题请在易班 App 中操作',
        // 被忽略时直接执行的操作
        () => pushToWebViewSSO('https://api.uyiban.com/base/c/rgsid/login', '校本化'),
        // 普通按钮
        [
          {
            text: '暂不打开',
            style: 'cancel',
          },
          {
            text: '打开',
            onPress: () => {
              pushToWebViewSSO('https://api.uyiban.com/base/c/rgsid/login', '校本化');
            },
          },
        ],
        { cancelable: true },
      );
    },
  },
  {
    id: 190,
    name: '失物招领',
    icon: LostFoundIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/lostAndFound/app',
      title: '失物招领',
      sso: true,
    },
  },
  {
    id: 200,
    name: '水电缴费',
    icon: UtilityPaymentIcon,
    type: ToolType.LINK,
    href: '/toolbox/utility-payment',
  },
  {
    id: 210,
    name: '约',
    icon: FreeFriendsIcon,
    type: ToolType.LINK,
    href: '/toolbox/free-friends',
  },
  {
    id: 9999,
    name: '更多',
    icon: MoreIcon,
    type: ToolType.LINK,
    href: '/toolbox/more',
  },
] as const;

// 工具函数：处理工具数据，按列数填充占位符
const processTools = (tools: ToolboxTool[], columns: number): ToolboxTool[] => {
  const remainder = tools.length % columns;
  if (remainder === 0) return tools; // 不需要填充

  const placeholders = Array(columns - remainder).fill({
    id: -1,
    name: '',
    icon: null,
    type: ToolType.NULL,
    data: '',
  });

  return [...tools, ...placeholders];
};

function processBannerData(bannerData: LaunchScreenScreenResponse): BannerContent[] {
  const banners: BannerContent[] = [];
  for (const banner of bannerData) {
    if (!banner.url) break;
    if (banner.type === 2 && banner.href) {
      // 网页跳转
      banners.push({
        image: { uri: banner.url },
        text: banner.text ?? '',
        type: BannerType.URL,
        href: banner.href,
      });
    } else if (banner.type === 3 && banner.href) {
      // 跳转 activity
      banners.push({
        image: { uri: banner.url },
        text: banner.text ?? '',
        type: BannerType.Activity,
        href: banner.href,
      });
    } else {
      // 纯图片
      banners.push({
        image: { uri: banner.url },
        text: banner.text ?? '',
        type: BannerType.NULL,
      });
    }
  }
  return banners;
}

function applyTypeAndExtra(tool: Partial<ToolboxTool>, item: any): Partial<ToolboxTool> | null {
  const { type, extra } = item;
  if (!type) return tool;

  switch (type) {
    case ToolType.LINK:
      return { ...tool, type: ToolType.LINK, href: extra as Href };
    case ToolType.WEBVIEW:
      try {
        const params = JSON.parse(extra);
        if (params && typeof params === 'object' && typeof params.url === 'string') {
          return { ...tool, type: ToolType.WEBVIEW, params };
        } else {
          console.error('webview params无效：', extra);
        }
      } catch (e) {
        console.error('webview params parse失败：', extra, e);
      }
      break;
    case ToolType.NULL:
      // 没有extra
      return { ...tool, type: ToolType.NULL };
    case ToolType.FUNCTION: // 不支持动态修改为FUNCTION
    default:
      console.error('配置中工具类型不支持：', item);
      break;
  }
  return null;
}

// 自定义 Hook：管理横幅和工具数据
const useToolsPageData = (columns: number) => {
  const { data: bannerData } = useApiRequest(
    getApiV1LaunchScreenScreen,
    {
      type: 2, // 1为开屏页，2为轮播图
      student_id: LocalUser.getUser().userid || '',
      device: Platform.OS,
    },
    { persist: true, queryKey: [TOOLBOX_BANNER_KEY], staleTime: EXPIRE_ONE_DAY },
  );
  const { data: configData } = useApiRequest(
    getApiV1ToolboxConfig,
    {
      version: parseInt(DeviceInfo.getBuildNumber(), 10),
      student_id: LocalUser.getUser().userid || '',
      platform: Platform.OS,
    },
    { persist: true, queryKey: [TOOLBOX_CONFIG_KEY], staleTime: EXPIRE_ONE_DAY },
  );
  const [bannerList, setBannerList] = useState<BannerContent[]>([]);
  const userType = useMemo(() => LocalUser.getUser().type as UserType, []);

  const baseTools = useMemo(
    () =>
      DEFAULT_TOOLS.filter(item => !item.userTypes || item.userTypes.includes(userType)).map(tool => ({
        ...tool,
      })),
    [userType],
  );

  const [toolList, setToolList] = useState<ToolboxTool[]>(baseTools);

  useEffect(() => {
    if (configData) {
      const toolMap = new Map<number, ToolboxTool>(baseTools.map(tool => [tool.id, { ...tool }]));

      configData.forEach(item => {
        if (item.visible === false) {
          if (toolMap.has(item.tool_id)) {
            toolMap.delete(item.tool_id);
          }
          return;
        }

        const existingTool = toolMap.get(item.tool_id);

        if (existingTool) {
          // 修改已存在的工具
          const baseTool = { ...existingTool };
          if (item.name) baseTool.name = item.name;
          if (item.icon) baseTool.icon = item.icon;
          if (item.message) baseTool.message = item.message;

          const updatedTool = applyTypeAndExtra(baseTool, item);

          if (updatedTool && isToolboxTool(updatedTool)) {
            toolMap.set(item.tool_id, updatedTool as ToolboxTool);
          } else {
            console.error('修改工具非法：', updatedTool);
          }
        } else {
          // 添加新工具
          const baseTool = {
            id: item.tool_id,
            name: item.name || '',
            icon: item.icon || null,
            message: item.message,
          };

          const newTool = applyTypeAndExtra(baseTool, item);

          if (newTool && isToolboxTool(newTool)) {
            toolMap.set(item.tool_id, newTool as ToolboxTool);
          }
        }
      });
      // 按照id升序排序
      setToolList(Array.from(toolMap.values()).sort((a, b) => a.id - b.id));
    } else {
      // 本地的已经有序
      setToolList(baseTools);
    }
  }, [configData, baseTools]);

  const processedTools = useMemo(() => {
    return processTools(toolList, columns);
  }, [toolList, columns]);

  const processedBanners = useMemo(() => {
    if (bannerData) {
      const processed = processBannerData(bannerData);
      return processed.length > 0 ? processed : DEFAULT_BANNERS;
    }
    return DEFAULT_BANNERS;
  }, [bannerData]);

  useEffect(() => {
    setBannerList(processedBanners);
  }, [processedBanners]);

  return { bannerList, toolList: processedTools };
};

type ToolButtonProps = Omit<ButtonProps, 'size'> & {
  tool: ToolboxTool;
  textWidth: number;
  fontSize: number;
};

const ToolButton = memo(
  forwardRef<React.ComponentRef<typeof Pressable>, ToolButtonProps>(({ tool, textWidth, fontSize }, ref) => {
    const router = useRouter();

    return (
      <Button
        className="mx-0 mb-3 h-auto w-auto items-center justify-start bg-transparent"
        size="icon"
        ref={ref}
        onPress={() => {
          if (tool.message) {
            toast.info(tool.message);
          }
          toolOnPress(tool, router);
        }}
      >
        {tool.icon ? (
          typeof tool.icon === 'string' ? (
            <Image source={{ uri: tool.icon }} className="h-[42px] w-[42px]" />
          ) : (
            <tool.icon width="42px" height="42px" />
          )
        ) : null}
        <Text
          className="mt-0.5 text-center align-middle text-text-secondary"
          style={{
            width: textWidth,
            fontSize: fontSize,
          }}
          numberOfLines={2} // 最大行数
          ellipsizeMode="tail"
        >
          {tool.name}
        </Text>
      </Button>
    );
  }),
);

ToolButton.displayName = 'ToolButton';

export default function ToolsPage() {
  const { width: screenWidth } = useWindowDimensions();

  const columns = 5;

  // 计算缩放值
  const { scaledTextWidth, scaledFontSize } = useMemo(() => {
    const baseWidth = 392; // 基准屏幕宽度
    const baseTextWidth = 60; // 基准文字宽度
    const baseFontSize = 12; // 基准字体大小

    return {
      scaledTextWidth: Math.min((baseTextWidth * screenWidth) / baseWidth, 72),
      scaledFontSize: Math.min((baseFontSize * screenWidth) / baseWidth, 14), // 限制最大字体大小为14，避免横屏字体过大
    };
  }, [screenWidth]);

  const { bannerList, toolList } = useToolsPageData(columns);

  // 工具按钮的渲染函数
  const renderToolButton = useCallback(
    ({ item }: { item: ToolboxTool }) => {
      return <ToolButton tool={item} textWidth={scaledTextWidth} fontSize={scaledFontSize} />;
    },
    [scaledTextWidth, scaledFontSize],
  );

  // FlatList 的 keyExtractor
  const keyExtractor = useCallback((item: ToolboxTool, index: number) => {
    return item.name ? `${item.name}-${index}` : `placeholder-${index}`;
  }, []);

  return (
    <PageContainer className="p-6">
      <FlatList
        ListHeaderComponent={
          /* 滚动横幅 */
          // 42对应上面的padding值，限制最大值避免横屏时过宽
          <View className="flex items-center">
            <Banner contents={bannerList} width={Math.min(screenWidth - 42, 550)} />
          </View>
        }
        ListHeaderComponentClassName="mb-4"
        data={toolList}
        keyExtractor={keyExtractor}
        numColumns={columns}
        columnWrapperClassName="justify-between"
        renderItem={renderToolButton}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      />
    </PageContainer>
  );
}
