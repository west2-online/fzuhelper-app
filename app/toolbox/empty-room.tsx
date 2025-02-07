import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import type { JwchAcademicGpaResponse } from '@/api/backend';
import { getApiV1JwchAcademicGpa } from '@/api/generate';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';

// TODO: 该页面需要更新为空教室

export default function EmptyRoomPage() {
  const [isRefreshing, setIsRefreshing] = useState(false); // 按钮是否禁用
  const [academicData, setAcademicData] = useState<JwchAcademicGpaResponse | null>(null); // 学术成绩数据

  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  // 访问 west2-online 服务器
  const getAcademicData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const result = await getApiV1JwchAcademicGpa();
      setAcademicData(result.data.data);
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        toast.error(data.msg ? data.msg : '未知错误');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, handleError]);

  return (
    <>
      <Stack.Screen options={{ title: '空教室' }} />

      <ThemedView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* 学术成绩数据列表 */}
          {academicData && (
            <View className="mt-4">
              <Text className="mb-2 text-lg font-semibold">上次刷新时间: {academicData.time}</Text>
              <View className="gap-4">
                {academicData.data.map((item, index) => (
                  <View
                    key={index}
                    className="mb-2 flex-row items-center justify-between border-b border-gray-300 pb-2"
                  >
                    <Text className="capitalize text-gray-500">{item.type}:</Text>
                    <Text className="font-medium text-black">{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <Button onPress={getAcademicData} disabled={isRefreshing} className="mb-4">
            <Text>{isRefreshing ? '刷新中...' : '刷新学业情况'}</Text>
          </Button>
        </ScrollView>
      </ThemedView>
    </>
  );
}
