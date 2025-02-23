import { router, useNavigation, type Href } from 'expo-router';
import { useLayoutEffect } from 'react';
import { View, type ImageSourcePropType } from 'react-native';

import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import CreditIcon from '@/assets/images/toolbox/academic/ic_credit.png';
import GpaIcon from '@/assets/images/toolbox/academic/ic_gpa.png';
import PlanIcon from '@/assets/images/toolbox/academic/ic_plan.png';
import ScoreIcon from '@/assets/images/toolbox/academic/ic_score.png';
import UnifiedIcon from '@/assets/images/toolbox/academic/ic_unified.png';
import LabelIconEntry from '@/components/label-icon-entry';

interface MenuItem {
  icon: ImageSourcePropType;
  name: string; // 菜单项名称
  link: Href; // 跳转链接
}

// 菜单项数据
const menuItems: MenuItem[] = [
  {
    icon: ScoreIcon,
    name: '成绩查询',
    link: '/toolbox/academic/grades' as Href,
  },
  {
    icon: GpaIcon,
    name: '绩点排名',
    link: '/toolbox/academic/gpa' as Href,
  },
  {
    icon: CreditIcon,
    name: '学分统计',
    link: '/toolbox/academic/credits' as Href,
  },
  {
    icon: UnifiedIcon,
    name: '统考成绩',
    link: '/toolbox/academic/unified-exam' as Href,
  },
  {
    icon: PlanIcon,
    name: '培养计划',
    link: '/toolbox/academic/plan' as Href,
  },
];

const NAVIGATION_TITLE = '学业状况';

export default function AcademicPage() {
  // 设置导航栏标题
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  return (
    <PageContainer className="bg-background p-4">
      {/* 菜单列表 */}
      <View className="mx-4 space-y-4">
        {menuItems.map((item, index) => (
          <LabelIconEntry key={index} icon={item.icon} label={item.name} onPress={() => router.push(item.link)} />
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
    </PageContainer>
  );
}
