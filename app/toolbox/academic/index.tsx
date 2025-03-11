import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import CreditIcon from '@/assets/images/toolbox/academic/ic_credit.png';
import GpaIcon from '@/assets/images/toolbox/academic/ic_gpa.png';
import PlanIcon from '@/assets/images/toolbox/academic/ic_plan.png';
import ScoreIcon from '@/assets/images/toolbox/academic/ic_score.png';
import UnifiedIcon from '@/assets/images/toolbox/academic/ic_unified.png';
import LabelIconEntry from '@/components/label-icon-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { getApiV1JwchAcademicPlan } from '@/api/generate';
import { LoadingDialog } from '@/components/loading';
import useApiRequest from '@/hooks/useApiRequest';
import { LocalUser, USER_TYPE_UNDERGRADUATE } from '@/lib/user';
import { pushToWebViewJWCH } from '@/lib/webview';
import { ToolType, UserType, toolOnPress, type Tool } from '@/utils/tools';
import { toast } from 'sonner-native';

const errorHandler = (error: any) => {
  if (error) {
    toast.error(error.msg ? error.msg : '培养计划没有找到');
  }
};

export default function AcademicPage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false); // 按钮是否禁用
  const { refetch } = useApiRequest(getApiV1JwchAcademicPlan, {}, { enabled: false, errorHandler });

  // 菜单项数据
  const MENU_ITEMS: Tool[] = [
    {
      icon: ScoreIcon,
      name: '成绩查询',
      type: ToolType.LINK,
      href: '/toolbox/academic/grades',
    },
    {
      icon: GpaIcon,
      name: '绩点排名',
      type: ToolType.LINK,
      href: '/toolbox/academic/gpa',
      userTypes: [USER_TYPE_UNDERGRADUATE],
    },
    {
      icon: CreditIcon,
      name: '学分统计',
      type: ToolType.LINK,
      href: '/toolbox/academic/credits',
      userTypes: [USER_TYPE_UNDERGRADUATE],
    },
    {
      icon: UnifiedIcon,
      name: '统考成绩',
      type: ToolType.LINK,
      href: '/toolbox/academic/unified-exam',
      userTypes: [USER_TYPE_UNDERGRADUATE],
    },
    {
      icon: PlanIcon,
      name: '培养计划',
      type: ToolType.FUNCTION,
      action: async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        const planData = await refetch();
        setIsRefreshing(false);
        if (planData.data) {
          pushToWebViewJWCH(planData.data || '', '培养计划');
        }
      },
      userTypes: [USER_TYPE_UNDERGRADUATE],
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: '学业状况' }} />
      <PageContainer className="p-4">
        {/* 菜单列表 */}
        <View className="mx-4 space-y-4">
          {MENU_ITEMS.filter(
            item => !item.userTypes || item.userTypes.includes(LocalUser.getUser().type as UserType),
          ).map((item, index) => (
            <LabelIconEntry key={index} icon={item.icon} label={item.name} onPress={() => toolOnPress(item, router)} />
          ))}
        </View>
        <View className="mx-4 space-y-4">
          <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
          <Text className="my-2 text-base text-text-secondary">
            在教务系统中可能没有全部专业的培养计划，或没有当前专业当前年级的培养计划
          </Text>
          <Text className="text-base text-text-secondary">
            统考成绩采集自教务系统数据，数据更新时间会晚于官方统考成绩公布渠道
          </Text>
        </View>
        <LoadingDialog open={isRefreshing} />
      </PageContainer>
    </>
  );
}
