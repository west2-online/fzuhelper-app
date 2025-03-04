import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { View } from 'react-native';

import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import LabelEntry from '@/components/label-entry';
import { pushToWebViewJWCH } from '@/lib/webview';

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

const NAVIGATION_TITLE = '选课';

export default function AcademicPage() {
  // 设置导航栏标题
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  return (
    <PageContainer className="bg-background px-8 pt-4">
      {/* 菜单列表 */}
      <View className="space-y-4">
        {menuItems.map((item, index) => (
          <LabelEntry key={index} leftText={item.name} onPress={() => pushToWebViewJWCH(item.url, item.name)} />
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
  );
}
