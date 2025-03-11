import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

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
  { name: '学期选课', url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glxk/xqxk/xqxk_cszt.aspx' },
  { name: '校选课', url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glxk/xxk/xxk_cszt.aspx' },
  { name: '重修选课', url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glxk/cxxk/cxxk_cszt.aspx' },
  { name: '辅修选课', url: 'https://jwcjwxt2.fzu.edu.cn:81/student/glxk/erzyxk/erzyxk_cszt.aspx' },
];

export default function AcademicPage() {
  return (
    <>
      <Stack.Screen options={{ title: '选课', headerTransparent: true }} />
      <PageContainer className="px-8 pt-4">
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
            教务系统的选课功能可能存在一定的问题，如有问题请及时联系教务处
          </Text>
          <Text className="my-2 text-base text-text-secondary">
            由于上述因素，我们不提供选课功能，仅提供跳转链接。您可以通过双指聚拢/散开来实现页面放大、缩小
          </Text>
          <Text className="my-2 text-base text-text-secondary">
            选课结束后务必重新进入选课页面确认选课无误，如有必要可以截图保留
          </Text>
        </View>
      </PageContainer>
    </>
  );
}
