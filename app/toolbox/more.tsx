// 目前仍有缺漏
import { Tabs, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import ElectroCarIcon from '@/assets/images/toolbox/ic_electrocar.svg';
import FAQModal from '@/components/FAQModal';
import { Icon } from '@/components/Icon';
import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';

import { FAQ_MORE } from '@/lib/FAQ';
import { getWebViewHref, pushToWebViewSSO } from '@/lib/webview';
import { ToolType, toolOnPress, type Tool } from '@/utils/tools';

// 更多页面中的工具列表
const MORE_TOOLS: Tool[] = [
  {
    // 会跳出提示：请重新登录，但实际上是可以正常使用的
    name: '福大邮箱',
    icon: ElectroCarIcon,
    type: ToolType.FUNCTION,
    action: () => {
      toast.info('请忽略重新登录提示，可以正常使用，校方正在修复中');
      pushToWebViewSSO('https://app.fzu.edu.cn/appService/mailbox/app/freeMailbox', '福大邮箱');
    },
  },
  {
    name: '讲座报告',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://www.fzu.edu.cn/jzbg.htm',
      title: '讲座报告',
      sso: true,
    },
  },
  {
    name: '考证信息查询',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://app.fzu.edu.cn/appService/guidance/app/searchExam',
      title: '考证信息查询',
      sso: true,
    },
  },
  // {
  //   // 不可用
  //   name: '马上就办',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'https://oss.fzu.edu.cn/kuz12345/',
  //     title: '马上就办',
  //     sso: true,
  //   },
  // },
  // {
  //   // 不可用
  //   name: '通知文件系统',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'https://info22-fzu-edu-cn-s.fzu.edu.cn/index.jsp',
  //     title: '通知文件系统',
  //     sso: true,
  //   },
  // },
  // {
  //   // 不可用
  //   name: '学生离校',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'http://ehall.fzu.edu.cn/portal/html/select_role.html?appId=4598215922499875',
  //     title: '学生离校',
  //     sso: true,
  //   },
  // },
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
  // {
  //   // sso 登录不可用
  //   name: '校园统一支付平台',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'http://tyzf.fzu.edu.cn',
  //     title: '校园统一支付平台',
  //     sso: true,
  //   },
  // },
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
    name: '一表通',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://sso.fzu.edu.cn/login?service=https://mybt.fzu.edu.cn/login',
      title: '一表通',
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
    name: '可信电子文档系统',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://sso.fzu.edu.cn/login?service=http%3A%2F%2Fetrust.fzu.edu.cn%2Fapi%2Fcas%2Flogin%3Fsource%3Dmobile',
      title: '可信电子文档系统',
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
  // 首页已有
  // {
  //   name: '失物招领',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/lostAndFound/app',
  //     title: '失物招领',
  //     sso: true,
  //   },
  // },
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
    name: '迎新服务',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'http://ehall.fzu.edu.cn/fxfw/sys/swmyxapp/*default/index.do',
      title: '迎新服务',
      sso: true,
    },
  },
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
  // {
  //   // 不可用
  //   name: '校园网接入指南',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'https://app.fzu.edu.cn/appService/guidance/app/articleInfo',
  //     title: '校园网接入指南',
  //     sso: true,
  //   },
  // },
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
    name: '党员培训',
    icon: ElectroCarIcon,
    type: ToolType.WEBVIEW,
    params: {
      url: 'https://sso.fzu.edu.cn/login?service=https://oss.fzu.edu.cn/api/auth/cas/connector/login?applicationUrl=https://oss.fzu.edu.cn/gbpxMobileUserApp',
      title: '党员培训',
      sso: true,
    },
  },
  // {
  //   // 不可用
  //   name: '党费查询',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'https://app.fzu.edu.cn/appEntry/app/index?redirectUrl=https://app.fzu.edu.cn/appService/partyDues/app/index',
  //     title: '党费查询',
  //     sso: true,
  //   },
  // },
  // {
  //   // sso 登录不可用
  //   name: '校领导信箱',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'http://ldxx.fzu.edu.cn',
  //     title: '校领导信箱',
  //     sso: true,
  //   },
  // },
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
  // {
  //   // 重要：学生无权限登录，点开会导致 sso 登录失败
  //   name: '横向财务综合信息系统',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'http://59.77.233.18/dlpt/caslogin.aspx',
  //     title: '横向财务综合信息系统',
  //     sso: true,
  //   },
  // },
  // {
  //   name: '横向项目合同管理系统',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'http://trpcontract.fzu.edu.cn/portal/',
  //     title: '横向项目合同管理系统',
  //     sso: true,
  //   },
  // },
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
  // {
  //   // sso 登录不可用
  //   name: '节能监管平台',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'http://ems.fzu.edu.cn/',
  //     title: '节能监管平台',
  //     sso: true,
  //   },
  // },
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
  // {
  //   // 不可用
  //   name: '社团管理',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'https://cloud.bywin.cn:3004/xgSystem/',
  //     title: '社团管理',
  //     sso: true,
  //   },
  // },
  // {
  //   // 不可用
  //   name: '学生社团活动',
  //   icon: ElectroCarIcon,
  //   type: ToolType.WEBVIEW,
  //   params: {
  //     url: 'https://cloud.bywin.cn:3004/xgSystem/',
  //     title: '学生社团活动',
  //     sso: true,
  //   },
  // },
];

export default function MoreToolsPage() {
  const router = useRouter();
  const [showFAQ, setShowFAQ] = useState(false); // 是否显示 FAQ 模态框
  // 处理 Modal 显示事件
  const handleModalVisible = useCallback(() => {
    setShowFAQ(prev => !prev);
  }, []);
  return (
    <PageContainer>
      <SafeAreaView edges={['bottom']}>
        <Tabs.Screen
          options={{
            title: '更多工具',
            // eslint-disable-next-line react/no-unstable-nested-components
            headerRight: () => (
              <Pressable onPress={handleModalVisible} className="flex flex-row items-center">
                <Icon name="help-circle-outline" size={26} className="mr-4" />
              </Pressable>
            ),
          }}
        />
        {/* 工具列表 */}
        <ScrollView className="mx-4" showsVerticalScrollIndicator={false}>
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
        <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} data={FAQ_MORE} />
      </SafeAreaView>
    </PageContainer>
  );
}
