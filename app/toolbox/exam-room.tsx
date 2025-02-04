import { getApiV1JwchClassroomExam } from '@/api/generate';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { toast } from 'sonner-native';

// 响应 data 结构
interface ExamData {
  credit: string; // 学分
  date: string; // 考试日期
  location: string; // 考试地点
  name: string; // 课程名称
  teacher: string; // 教师
  time: string; // 考试时间
}

const NAVIGATION_TITLE = '考场';

export default function ExamRoomPage() {
  const [isRefreshing, setIsRefreshing] = useState(false); // 按钮是否禁用
  const [ExamData, setExamData] = useState<ExamData[] | null>(null); // 考试数据

  const [currentTerm, setCurrentTerm] = useState('202401'); // 当前学期
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  // 设置导航栏标题
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  // 访问 west2-online 服务器
  const getExamData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const result = await getApiV1JwchClassroomExam({ term: currentTerm });

      // 按日期排序, 第一个 data 指的是响应 HTTP 的 data 字段，第二个 data 指的是响应数据的 data 字段
      const sortedData = result.data.data.sort((a, b) => a.date.localeCompare(b.date)).reverse();

      setExamData(sortedData);
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
    <ThemedView className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {ExamData &&
          ExamData.map((item, index) => (
            <Card key={index} className="mb-2">
              <Text className="capitalize text-gray-500">
                {item.name} - {item.teacher}
              </Text>
              <Text className="font-medium text-black">
                {item.date} - {item.location}
              </Text>
            </Card>
          ))}
        {/* 刷新按钮 */}
        <Button onPress={getExamData} disabled={isRefreshing} className="mb-4">
          <Text>{isRefreshing ? '刷新中...' : '刷新'}</Text>
        </Button>
      </ScrollView>
    </ThemedView>
  );
}
