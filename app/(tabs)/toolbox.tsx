import { Link, useRouter, type Href } from 'expo-router';
import { forwardRef, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, useWindowDimensions } from 'react-native';
import type { SvgProps } from 'react-native-svg';

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
import Banner, { BannerType, type BannerContent } from '@/components/banner';
import PageContainer from '@/components/page-container';
import { Button, ButtonProps } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { showIgnorableAlert } from '@/lib/common-settings';

import { LocalUser, USER_TYPE_UNDERGRADUATE } from '@/lib/user';
import { cn } from '@/lib/utils';
import { getWebViewHref, pushToWebViewSSO } from '@/lib/webview';
import { ToolType, UserType, toolOnPress, type Tool } from '@/utils/tools';

import { LaunchScreenScreenResponse } from '@/api/backend';
import { getApiV1LaunchScreenScreen } from '@/api/generate';
import useApiRequest from '@/hooks/useApiRequest';

// 工具类型的枚举

// 常量：横幅数据
const DEFAULT_BANNERS: BannerContent[] = [
  { image: BannerImage1, text: '', type: BannerType.NULL },
  { image: BannerImage2, text: '', type: BannerType.NULL },
  { image: BannerImage3, text: '', type: BannerType.NULL },
];

const DEFAULT_TOOLS: Tool[] = [
  {
    name: '学业状况',
    icon: GradeIcon,
    type: ToolType.LINK,
    href: '/toolbox/academic',
  },
  {
    name: '教务通知',
    icon: NotificationIcon,
    type: ToolType.LINK,
    href: '/toolbox/office-notice',
    userTypes: [USER_TYPE_UNDERGRADUATE],
  },
  {
    name: '历年卷',
    icon: FileIcon,
    type: ToolType.LINK,
    href: '/toolbox/paper',
  },
  {
    name: '空教室',
    icon: RoomIcon,
    type: ToolType.LINK,
    href: '/toolbox/empty-room',
  },
  {
    name: '考场查询',
    icon: ExamRoomIcon,
    type: ToolType.LINK,
    href: '/toolbox/exam-room',
  },
  {
    name: '一键评议',
    icon: OneKeyIcon,
    type: ToolType.LINK,
    href: '/toolbox/onekey-comment',
  },
  {
    name: '选课',
    icon: XuankeIcon,
    type: ToolType.LINK,
    href: '/toolbox/xuanke',
    userTypes: [USER_TYPE_UNDERGRADUATE],
  },
  {
    name: '各类申请',
    icon: ApplicationIcon,
    type: ToolType.LINK,
    href: '/toolbox/application',
    userTypes: [USER_TYPE_UNDERGRADUATE],
  },
  {
    name: '学生证',
    icon: IDCardIcon,
    type: ToolType.LINK,
    href: '/toolbox/id-card',
    userTypes: [USER_TYPE_UNDERGRADUATE],
  },
  {
    name: '毕业设计',
    icon: GraduationIcon,
    type: ToolType.LINK,
    href: '/toolbox/graduation',
    userTypes: [USER_TYPE_UNDERGRADUATE],
  },
  {
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
    name: '智慧餐厅',
    icon: ZHCTIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://hqczhct.fzu.edu.cn:8001/html/index.html',
      title: '智慧餐厅',
    },
  },
  {
    name: '校园指南',
    icon: WikiIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://fzuwiki.west2.online/?source=fzuhelper&utm_source=fzuhelper-app&utm_medium=toolbox',
      title: '校园指南',
    },
  },
  {
    name: '飞跃手册',
    icon: FZURunIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://run.west2.online/?source=fzuhelper&utm_source=fzuhelper-app&utm_medium=toolbox',
      title: '飞跃手册',
    },
  },
  {
    name: '学习中心',
    icon: StudyCenterIcon,
    type: ToolType.LINK,
    href: '/toolbox/learning-center',
  },
  {
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
    name: '水电缴费',
    icon: UtilityPaymentIcon,
    type: ToolType.LINK,
    href: '/toolbox/utility-payment',
  },
  {
    name: '更多',
    icon: MoreIcon,
    type: ToolType.LINK,
    href: '/toolbox/more',
  },
];

// 工具函数：处理工具数据，按列数填充占位符
const processTools = (tools: Tool[], columns: number): Tool[] => {
  const remainder = tools.length % columns;
  if (remainder === 0) return tools; // 不需要填充

  const placeholders = Array(columns - remainder).fill({
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

// 自定义 Hook：管理横幅和工具数据
const useToolsPageData = (columns: number) => {
  const { data: bannerData } = useApiRequest(getApiV1LaunchScreenScreen, {
    type: 2, // 1为开屏页，2为轮播图
    student_id: LocalUser.getUser().userid || '',
    device: Platform.OS,
  });
  const [bannerList, setBannerList] = useState<BannerContent[]>([]);
  const [toolList, setToolList] = useState<Tool[]>([]);

  const userType = useMemo(() => LocalUser.getUser().type as UserType, []);

  const filteredTools = useMemo(() => {
    return DEFAULT_TOOLS.filter(item => !item.userTypes || item.userTypes.includes(userType));
  }, [userType]);

  const processedTools = useMemo(() => {
    return processTools(filteredTools, columns);
  }, [filteredTools, columns]);

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

  useEffect(() => {
    setToolList(processedTools);
  }, [processedTools]);

  return { bannerList, toolList };
};

type ToolButtonProps = Omit<ButtonProps, 'size'> & {
  name: string;
  icon?: React.FC<SvgProps>;
  textWidth: number;
  fontSize: number;
};

const ToolButton = memo(
  forwardRef<React.ComponentRef<typeof Pressable>, ToolButtonProps>(
    ({ className, icon: Icon, name, onPress, textWidth, fontSize }, ref) => {
      return (
        <Button
          className={cn('mx-0 mb-3 h-auto w-auto items-center justify-start bg-transparent', className)}
          size="icon"
          onPress={onPress}
          ref={ref}
        >
          {Icon ? <Icon width="42px" height="42px" /> : null}
          <Text
            className="mt-0.5 text-center align-middle text-text-secondary"
            style={{
              width: textWidth,
              fontSize: fontSize,
            }}
            numberOfLines={2} // 最大行数
            ellipsizeMode="tail"
          >
            {name}
          </Text>
        </Button>
      );
    },
  ),
);

ToolButton.displayName = 'ToolButton';

type ToolButtonLinkProps = Omit<ToolButtonProps, 'onPress'> & {
  href: Href;
};

const ToolButtonLink = memo<ToolButtonLinkProps>(({ href, ...props }) => (
  <Link href={href} asChild>
    <ToolButton {...props} />
  </Link>
));

ToolButtonLink.displayName = 'ToolButtonLink';

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
  const router = useRouter();

  // 工具按钮的渲染函数
  const renderToolButton = useCallback(
    ({ item }: { item: Tool }) => {
      switch (item.type) {
        case ToolType.LINK:
          return (
            <ToolButtonLink
              name={item.name}
              href={item.href}
              icon={item.icon}
              textWidth={scaledTextWidth}
              fontSize={scaledFontSize}
            />
          );

        case ToolType.WEBVIEW:
          return (
            <ToolButtonLink
              name={item.name}
              href={getWebViewHref(item.params)}
              icon={item.icon}
              textWidth={scaledTextWidth}
              fontSize={scaledFontSize}
            />
          );

        default:
          return (
            <ToolButton
              name={item.name}
              icon={item.icon}
              onPress={() => toolOnPress(item, router)}
              textWidth={scaledTextWidth}
              fontSize={scaledFontSize}
            />
          );
      }
    },
    [router, scaledTextWidth, scaledFontSize],
  );

  // FlatList 的 keyExtractor
  const keyExtractor = useCallback((item: Tool, index: number) => {
    return item.name ? `${item.name}-${index}` : `placeholder-${index}`;
  }, []);

  return (
    <PageContainer className="p-6">
      <FlatList
        ListHeaderComponent={
          /* 滚动横幅 */
          <Banner contents={bannerList} />
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
