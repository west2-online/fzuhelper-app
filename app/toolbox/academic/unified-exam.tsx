import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { ThemedView } from '@/components/ThemedView';
import { UnifiedExamCard } from '@/components/academic/UnifiedExamCard';
import Loading from '@/components/loading';
import { Text } from '@/components/ui/text';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { JwchAcademicUnifiedExamResponse_UnifiedExamData as UnifiedExamData } from '@/api/backend';
import { getApiV1JwchAcademicUnifiedExam } from '@/api/generate';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UnifiedExamScorePage() {
  const [isRefreshing, setIsRefreshing] = useState(false); // 是否正在刷新
  const [unifiedExamData, setUnifiedExamData] = useState<UnifiedExamData[] | null>(null); // 学术成绩数据
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null); // 数据最后更新时间
  const handleErrorRef = useRef(useSafeResponseSolve().handleError); // 错误处理函数

  // 获取统考成绩数据
  const fetchUnifiedExamData = useCallback(async () => {
    try {
      const result = await getApiV1JwchAcademicUnifiedExam();
      setUnifiedExamData(result.data.data);
      setLastUpdated(new Date()); // 更新最后更新时间
    } catch (error: any) {
      const data = handleErrorRef.current(error);
      if (data) toast.error(data.msg || '发生未知错误，请稍后再试');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 初始化时获取数据
  useEffect(() => {
    setIsRefreshing(true);
    fetchUnifiedExamData();
  }, [fetchUnifiedExamData]);

  // 下拉刷新逻辑
  const handleRefresh = useCallback(() => {
    if (!isRefreshing) {
      setIsRefreshing(true); // 确保不会重复触发刷新
      setUnifiedExamData([]); // 清空数据
      fetchUnifiedExamData();
    }
  }, [fetchUnifiedExamData, isRefreshing]);

  return (
    <>
      <Stack.Screen options={{ title: '统考成绩' }} />
      <SafeAreaView className="flex-1" edges={['bottom']}>
        <ThemedView className="flex-1">
          <ScrollView
            className="p-4"
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          >
            {unifiedExamData && unifiedExamData.length > 0 ? (
              <>
                {/* 显示最后更新时间 */}
                {lastUpdated && (
                  <View className="mb-2 flex flex-row items-center justify-center rounded-lg p-2">
                    <Ionicons name="time-outline" size={16} className="mr-2 text-gray-500" />
                    <Text className="text-l leading-5 text-gray-600">数据同步时间：{lastUpdated.toLocaleString()}</Text>
                  </View>
                )}

                {unifiedExamData.map((item, index) => (
                  <UnifiedExamCard key={index} item={item} />
                ))}
              </>
            ) : (
              <Loading />
            )}
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    </>
  );
}
