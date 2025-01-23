import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons'; // 图标库，可以根据需求选择其他库
import { Href, Link, useNavigation } from 'expo-router'; // 假设您在使用 Expo Router
import { useLayoutEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// 定义菜单项的类型
interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap; // 图标名称
  name: string; // 菜单项名称
  link: Href; // 跳转链接
}

// 菜单项数据
const menuItems: MenuItem[] = [
  { icon: 'document-text-outline', name: '成绩查询', link: './grades' as Href },
  { icon: 'bar-chart-outline', name: '绩点查询', link: './gpa' as Href },
  { icon: 'medal-outline', name: '学分统计', link: './credits' as Href },
  { icon: 'ribbon-outline', name: '统考成绩', link: './unified-exam' as Href },
];

const NAVIGATION_TITLE = '学业状况';

export default function AcademicPage() {
  // 设置导航栏标题
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  return (
    <ThemedView className="flex-1 bg-white p-4">
      {/* 标题 */}
      <Text className="mb-6 text-xl font-bold">学业状况</Text>

      {/* 菜单列表 */}
      <View className="space-y-4">
        {menuItems.map((item, index) => (
          <Link key={index} href={item.link} asChild>
            <TouchableOpacity className="flex-row items-center justify-between rounded-lg bg-gray-50 p-4 shadow-sm">
              {/* 图标和名称 */}
              <View className="flex-row items-center space-x-4">
                <Ionicons name={item.icon} size={24} color="#007AFF" />
                <Text className="text-base font-medium text-gray-800">{item.name}</Text>
              </View>
              {/* 右侧箭头 */}
              <Ionicons name="chevron-forward-outline" size={20} color="#C0C0C0" />
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </ThemedView>
  );
}
