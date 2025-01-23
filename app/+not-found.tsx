import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons'; // 图标库
import { Link, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';

const NAVIGATION_TITLE = '哎呀，页面不见啦！';

export default function NotFoundScreen() {
  // 设置导航栏标题
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  return (
    <>
      {/* 页面内容 */}
      <ThemedView className="flex-1 items-center justify-center bg-white p-5">
        {/* 可爱表情图标 */}
        <Ionicons name="sad-outline" size={80} color="#FF6F61" />

        {/* 提示文字 */}
        <Text className="mt-6 text-center text-lg font-semibold text-gray-800">哎呀，这个页面被小猫叼走啦！</Text>
        <Text className="mt-2 text-center text-base text-gray-600">不用担心，你可以回到首页重新找路~</Text>

        {/* 返回首页按钮 */}
        <Link href="/" asChild>
          <TouchableOpacity className="mt-8 rounded-full bg-blue-500 px-6 py-3 shadow-md">
            <Text className="text-lg font-medium text-white">🏠 回到首页</Text>
          </TouchableOpacity>
        </Link>
      </ThemedView>
    </>
  );
}
