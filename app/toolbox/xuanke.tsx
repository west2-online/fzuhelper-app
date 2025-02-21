import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { View } from 'react-native';

import PageContainer from '@/components/page-container';

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
    </PageContainer>
  );
}
