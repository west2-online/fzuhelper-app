import { Link, useRouter, type Href, type Router } from 'expo-router';
import { forwardRef, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, useWindowDimensions } from 'react-native';
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
import OneKeyIcon from '@/assets/images/toolbox/ic_onekey.svg';
import RoomIcon from '@/assets/images/toolbox/ic_room.svg';
import FZURunIcon from '@/assets/images/toolbox/ic_run.svg';
import IDCardIcon from '@/assets/images/toolbox/ic_studentcard.svg';
import StudyCenterIcon from '@/assets/images/toolbox/ic_studycenter.svg';
import WikiIcon from '@/assets/images/toolbox/ic_wiki.svg';
import XiaoBenIcon from '@/assets/images/toolbox/ic_xiaobenhua.svg';
import XuankeIcon from '@/assets/images/toolbox/ic_xuanke.svg';
import ZHCTIcon from '@/assets/images/toolbox/ic_zhct.svg';
import Banner, { type BannerContent } from '@/components/banner';
import PageContainer from '@/components/page-container';
import { Button, ButtonProps } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { showIgnorableAlert } from '@/lib/common-settings';

import { LocalUser, USER_TYPE_UNDERGRADUATE } from '@/lib/user';
import { cn } from '@/lib/utils';
import { getWebViewHref, pushToWebViewSSO } from '@/lib/webview';
import { ToolType, UserType, toolOnPress, type Tool } from '@/utils/tools';

// 工具类型的枚举

// 常量：横幅数据
const DEFAULT_BANNERS: BannerContent[] = [
  { image: BannerImage1, onPress: () => {} },
  { image: BannerImage2, onPress: () => {} },
  { image: BannerImage3, onPress: () => {} },
];

const DEFAULT_TOOLS: Tool[] = [
  {
    name: '学业状况',
    icon: GradeIcon,
    type: ToolType.LINK,
    href: '/toolbox/academic',
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
    type: ToolType.FUNCTION,
    userTypes: [USER_TYPE_UNDERGRADUATE],
    action: async () => {
      Alert.alert('暂未开放', '新版一键评议正在设计中，预计学期结束前（即评议开始前）上线，敬请期待');
    },
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
    name: '更多',
    icon: MoreIcon,
    type: ToolType.LINK,
    href: '/toolbox/more',
  },
];

// 工具函数：处理工具数据，按列数填充占位符
const processTools = (tools: Tool[], columns: number) => {
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

// 自定义 Hook：管理横幅和工具数据
const useToolsPageData = (columns: number) => {
  const [bannerList, setBannerList] = useState<BannerContent[]>([]);
  const [toolList, setToolList] = useState<Tool[]>([]);

  useEffect(() => {
    // 模拟数据加载
    setBannerList(DEFAULT_BANNERS);
    setToolList(
      // 此处会进行一层过滤，只显示当前用户类型可用的工具
      processTools(
        DEFAULT_TOOLS.filter(item => !item.userTypes || item.userTypes.includes(LocalUser.getUser().type as UserType)),
        columns,
      ),
    );
  }, [columns]);

  return { bannerList, toolList };
};

type ToolButtonProps = Omit<ButtonProps, 'size'> & {
  name: string;
  icon?: React.FC<SvgProps>;
};

// eslint-disable-next-line react/display-name
const ToolButton = forwardRef<React.ElementRef<typeof Pressable>, ToolButtonProps>(
  ({ className, icon: Icon, name, onPress }, ref) => (
    <Button
      className={cn('mb-3 h-auto w-auto items-center justify-center bg-transparent', className)}
      size="icon"
      onPress={onPress}
      ref={ref}
    >
      {Icon ? <Icon width="42px" height="42px" /> : null}
      <Text
        className="w-[60px] text-center align-middle text-text-secondary"
        // eslint-disable-next-line react-native/no-inline-styles
        style={{ fontSize: 12 }} // 未知原因，tailwind指定text-xs无效
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {name}
      </Text>
    </Button>
  ),
);

type ToolButtonLinkProps = Omit<ToolButtonProps, 'onPress'> & {
  href: Href;
};

const ToolButtonLink: React.FC<ToolButtonLinkProps> = ({ href, ...props }) => (
  <Link href={href} asChild>
    <ToolButton {...props} />
  </Link>
);

// 工具按钮的渲染函数
const renderToolButton = (item: Tool, router: Router) => {
  if (item.type === ToolType.LINK) {
    return <ToolButtonLink name={item.name} href={item.href} icon={item.icon} />;
  }

  if (item.type === ToolType.WEBVIEW) {
    return <ToolButtonLink name={item.name} href={getWebViewHref(item.params)} icon={item.icon} />;
  }

  return <ToolButton name={item.name} icon={item.icon} onPress={() => toolOnPress(item, router)} />;
};

export default function ToolsPage() {
  const { width: screenWidth } = useWindowDimensions();

  const TOOL_BUTTON_WIDTH = 70; // 每个按钮的宽度（包括间距）
  const PADDING = 16; // 页面左右边距
  const MAX_COLUMNS = 5; // 最大列数
  const MIN_COLUMNS = 1; // 最小列数

  // 计算可用列数
  const columns = Math.max(
    MIN_COLUMNS,
    Math.min(MAX_COLUMNS, Math.floor((screenWidth - PADDING * 2) / TOOL_BUTTON_WIDTH)),
  );

  const { bannerList, toolList } = useToolsPageData(columns);
  const router = useRouter();

  return (
    <PageContainer className="p-6">
      {/* 滚动横幅 */}
      <Banner contents={bannerList} />

      {/* 工具区域 */}
      <FlatList
        data={toolList}
        keyExtractor={(_, index) => index.toString()}
        numColumns={columns} // 使用动态计算的列数
        className="mt-4"
        columnWrapperClassName="justify-between"
        renderItem={({ item }) => renderToolButton(item, router)}
      />
    </PageContainer>
  );
}
