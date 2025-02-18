import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

import type { JwchAcademicUnifiedExamResponse_UnifiedExamData as UnifiedExamData } from '@/api/backend';
import { getApiV1JwchAcademicUnifiedExam } from '@/api/generate';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { SafeAreaView } from 'react-native-safe-area-context';
// 生成统考成绩卡片
interface UnifiedExamProps {
  item: UnifiedExamData;
}
const UnifiedExamCard: React.FC<UnifiedExamProps> = ({ item }) => (
  <Card className="mb-1 mt-1 flex-row justify-between p-2">
    <View className="flex-1">
      <Text className="text-lg font-bold">{item.name}</Text>
      <Text className="text-sm text-gray-500">{item.term}</Text>
    </View>
    <View className="flex-row items-center">
      <Text className="text-3xl">{item.score}</Text>
    </View>
  </Card>
);

export default function UnifiedExamScorePage() {
  const [isRefreshing, setIsRefreshing] = useState(false); // 按钮是否禁用
  const [unifiedExamData, setUnifiedExamData] = useState<UnifiedExamData[] | null>(null); // 学术成绩数据

  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  // 访问 west2-online 服务器
  const fetchUnifiedExamData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const result = await getApiV1JwchAcademicUnifiedExam();
      setUnifiedExamData(result.data.data);
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        toast.error(data.msg ? data.msg : '未知错误');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [handleError]);

  // 初次加载数据
  useEffect(() => {
    fetchUnifiedExamData();
  }, [fetchUnifiedExamData]);

  console.log(unifiedExamData);

  return (
    <>
      <Stack.Screen options={{ title: '统考成绩' }} />
      <SafeAreaView className="flex-1" edges={['bottom']}>
        <ThemedView className="flex-1">
          <ScrollView
            className="p-4"
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={fetchUnifiedExamData} />}
          >
            {unifiedExamData?.map((item, index) => <UnifiedExamCard key={index} item={item} />)}
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    </>
  );
}
