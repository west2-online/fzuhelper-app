import { getApiV1JwchClassroomExam, getApiV1JwchTermList } from '@/api/generate';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { toast } from 'sonner-native';

import { View } from 'react-native';
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
  const [examData, setExamData] = useState<ExamData[] | null>(null); // 考试数据
  const [termList, setTermList] = useState<string[] | null>([]); // 学期列表
  const [currentTerm, setCurrentTerm] = useState('202401'); // 当前学期
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  // 设置导航栏标题
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  // 合并刷新考试数据和学期列表请求
  const refreshData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const [examResult, termResult] = await Promise.all([
        getApiV1JwchClassroomExam({ term: currentTerm }),
        getApiV1JwchTermList(),
      ]);

      const sortedExamData = examResult.data.data.sort((a, b) => a.date.localeCompare(b.date)).reverse();
      setExamData(sortedExamData);
      setTermList(termResult.data.data);
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        toast.error(data.msg ? data.msg : '未知错误');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, currentTerm, handleError]);

  // 自动刷新： tab 变换时刷新
  useEffect(() => {
    refreshData();
  }, [currentTerm]);

  return (
    <ThemedView className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Tabs value={currentTerm} onValueChange={setCurrentTerm} className="my-6 flex-1 items-center">
          <TabsList className="w-full flex-row">
            {termList &&
              termList.map((item, index) => (
                <TabsTrigger key={index} value={item} className="flex-1">
                  <Text className="items-center">{item}</Text>
                </TabsTrigger>
              ))}
          </TabsList>
        </Tabs>

        {examData &&
          examData.map((item, index) => (
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
        {/* <Button onPress={refreshData} disabled={isRefreshing}>
          <Text>{isRefreshing ? '刷新中...' : '刷新'}</Text>
        </Button> */}
      </ScrollView>
    </ThemedView>
  );
}
