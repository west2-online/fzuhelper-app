import { Link, Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { getWebViewHrefJWCH } from '@/lib/webview';

interface MenuItem {
  name: string; // 菜单项名称
  url: string;
}

// 菜单项数据
const menuItems: MenuItem[] = [
  { name: '转专业申请', url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glsq/zzysq/zzyapplication.aspx' },
  { name: '缓考申请', url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glsq/hksq/hkapplication.aspx' },
  { name: '免修申请', url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glsq/mxsq/mxapplication.aspx' },
  { name: '辅修申请', url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glsq/fxsq/fxapplication.aspx' },
  {
    name: '教室申请',
    url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glsq/jssq/classroomapplication.aspx',
  },
  { name: '学分认定', url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glsq/xftd/xftd_cszt.aspx' },
  {
    name: '大类分专业',
    url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glsq/majordistribution/major_cszt.aspx',
  },
  {
    name: '选修转创拓',
    url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glsq/xxzcy/xxzcy_cszt.aspx',
  },
];

export default function ApplicationPage() {
  return (
    <>
      <Stack.Screen options={{ title: '各类申请' }} />
      <PageContainer className="px-8 pt-4">
        <ScrollView>
          {/* 菜单列表 */}
          <View className="space-y-4">
            {menuItems.map(item => (
              <Link key={item.name} href={getWebViewHrefJWCH(item.url, item.name)} asChild>
                <LabelEntry leftText={item.name} />
              </Link>
            ))}
          </View>
          <View className="space-y-4">
            <Text className="my-2 text-lg font-bold text-text-secondary">友情提示</Text>
            <Text className="my-2 text-base text-text-secondary">
              我们建议只在 APP 内查看申请进度和结果，申请过程使用电脑端教务系统提交
            </Text>
            <Text className="my-2 text-base text-text-secondary">
              如果页面显示过小，您可以通过双指聚拢/散开来实现页面放大、缩小
            </Text>
          </View>
        </ScrollView>
      </PageContainer>
    </>
  );
}
