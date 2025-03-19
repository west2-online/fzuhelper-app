// 目前仍有缺漏
import { Stack, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import ElectroCarIcon from '@/assets/images/toolbox/ic_electrocar.svg';
import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { getWebViewHref } from '@/lib/webview';
import { ToolType, toolOnPress, type Tool } from '@/utils/tools';

// 更多页面中的工具列表
const MORE_TOOLS: Tool[] = [
  {
    name: '马上就办',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://oss.fzu.edu.cn/kuz12345/',
      title: '马上就办',
      sso: true,
    },
  },
  {
    name: '通知文件系统',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://info22-fzu-edu-cn-s.fzu.edu.cn/index.jsp',
      title: '通知文件系统',
      sso: true,
    },
  },
  {
    name: '学生离校',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://ehall.fzu.edu.cn/portal/html/select_role.html?appId=4598215922499875',
      title: '学生离校',
      sso: true,
    },
  },
  {
    name: '校友活动',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/activityCenter/app/center',
      title: '校友活动',
      sso: true,
    },
  },
  {
    name: '校园统一支付平台',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://tyzf.fzu.edu.cn',
      title: '校园统一支付平台',
      sso: true,
    },
  },
  {
    name: '一卡通',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://xcx.fzu.edu.cn/berserker-auth/cas/login/wisedu?targetUrl=https%3A%2F%2Fxcx.fzu.edu.cn%2Fberserker-base%2Fredirect%3FappId%3D16%26nodeId%3D15%26type%3Dapp',
      title: '一卡通',
      sso: true,
    },
  },
  {
    name: '个人简历',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/curriculumVitae/app/index',
      title: '个人简历',
      sso: true,
    },
  },
  {
    name: '场地预约',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/area/app/index',
      title: '场地预约',
      sso: true,
    },
  },
  {
    name: '失物招领',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/lostAndFound/app',
      title: '失物招领',
      sso: true,
    },
  },
  // 不如历年卷
  // {
  //   name: '学习资料分享',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/studyShare/app/index',
  //     title: '学习资料分享',
  //     sso: true,
  //   },
  // },
  {
    name: '实名身份核验',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://idself.fzu.edu.cn/public/client/account-activate/name?backUrl=https:%2F%2Fidself.fzu.edu.cn',
      title: '实名身份核验',
      sso: true,
    },
  },
  {
    name: '智慧体育',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://aisports.fzu.edu.cn/api/cas/rankingsPage?schoolNo=',
      title: '智慧体育',
      sso: true,
    },
  },
  {
    name: '校园地图',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://map.fzu.edu.cn',
      title: '校园地图',
      sso: true,
    },
  },
  {
    name: '校园活动',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/activityCenter/app/center',
      title: '校园活动',
      sso: true,
    },
  },
  {
    name: '校园活动收藏',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/activityCenter/app/collectList',
      title: '校园活动收藏',
      sso: true,
    },
  },
  {
    name: '校园网报修',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://59.77.227.111:32001/relax/mobile/index.html',
      title: '校园网报修',
      sso: true,
    },
  },
  {
    name: '校园网接入指南',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appService/guidance/app/articleInfo?id=e0e55455-ef20-4445-8c27-5f95d8fef416',
      title: '校园网接入指南',
      sso: true,
    },
  },
  {
    name: '校园风光',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/scenery/app/index',
      title: '校园风光',
      sso: true,
    },
  },
  {
    name: '电动车登记',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://doorwxoa.fzu.edu.cn/nonmotorReg',
      title: '电动车登记',
      sso: true,
    },
  },
  {
    name: '集体返校预约',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/backToSchool/app/index',
      title: '集体返校预约',
      sso: true,
    },
  },
  {
    name: '党费查询',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/partyDues/app/index',
      title: '党费查询',
      sso: true,
    },
  },
  {
    name: '校领导信箱',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://ldxx.fzu.edu.cn',
      title: '校领导信箱',
      sso: true,
    },
  },
  {
    name: '校园出入管理系统',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://dooroa.fzu.edu.cn/cas/index',
      title: '校园出入管理系统',
      sso: true,
    },
  },
  {
    name: '横向财务综合信息系统',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://59.77.233.18/dlpt/caslogin.aspx',
      title: '横向财务综合信息系统',
      sso: true,
    },
  },
  {
    name: '横向项目合同管理系统',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://trpcontract.fzu.edu.cn/portal/',
      title: '横向项目合同管理系统',
      sso: true,
    },
  },
  {
    name: '住宿服务申请',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://ehall.fzu.edu.cn/ssfw/sys/xszsapp/*default/index.do',
      title: '住宿服务申请',
      sso: true,
    },
  },
  // 已经在工具箱主页面提供
  // {
  //   name: '公寓报修',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'http://ehall.fzu.edu.cn/ssfw/sys/ssbxapp/*default/index.do',
  //     title: '公寓报修',
  //     sso: true,
  //   },
  // },
  {
    name: '节能监管平台',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://ems.fzu.edu.cn/',
      title: '节能监管平台',
      sso: true,
    },
  },
  {
    name: '一卡通服务大厅',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://xcx.fzu.edu.cn/berserker-auth/cas/login/wisedu?targetUrl=https%3A%2F%2Fxcx.fzu.edu.cn%2Fplat-pc%3Fname%3DloginTransit%0A',
      title: '一卡通服务大厅',
      sso: true,
    },
  },
  {
    name: '物联平台（正式）',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://aiot.fzu.edu.cn',
      title: '物联平台（正式）',
      sso: true,
    },
  },
  {
    name: '社团管理',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://cloud.bywin.cn:3004/xgSystem/',
      title: '社团管理',
      sso: true,
    },
  },
  {
    name: '学生社团活动',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://cloud.bywin.cn:3004/xgSystem/',
      title: '学生社团活动',
      sso: true,
    },
  },
];

export default function MoreToolsPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <Stack.Screen options={{ title: '更多工具' }} />
      {/* 友情提示 */}
      <View className="mx-4 space-y-4">
        <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
        <Text className="my-2 text-base text-text-secondary">1. 部分服务需要校内网络环境（FZU）或科研网络环境</Text>
        <Text className="my-2 text-base text-text-secondary">
          2. 以下功能均需要登录统一身份认证平台，如果提示登录异常，可以在我的-右上角设置中退出登录后重新尝试
        </Text>
        <Text className="my-2 text-base text-text-secondary">
          3. App 仅提供跳转便利，不负责维护内容与功能，页面可能出现无法加载的情况
        </Text>
        <Text className="my-2 text-lg font-bold text-text-secondary">功能一览</Text>
      </View>
      {/* 工具列表 */}
      <ScrollView className="mx-4 space-y-4">
        {MORE_TOOLS.map((item, index) => (
          <LabelEntry
            key={index}
            leftText={item.name}
            onPress={() => {
              if (item.type === ToolType.WEBVIEW && item.params) {
                router.push(getWebViewHref(item.params));
              } else {
                toolOnPress(item, router);
              }
            }}
          />
        ))}
      </ScrollView>
    </PageContainer>
  );
}
