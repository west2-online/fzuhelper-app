import type { JwchCourseListResponse as CourseData, JwchClassroomExamResponse as ExamData } from '@/api/backend';
import { getApiV1JwchClassroomExam, getApiV1JwchCourseList, getApiV1JwchTermList } from '@/api/generate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';
// 合并后列表项结构
interface MergedData {
  name: string;
  date: string | null;
  location: string | null;
  teacher: string;
  time: string | null;
}

const NAVIGATION_TITLE = '考场';

// 特殊字符映射标签
const SYMBOLS_MAP = {
  '▲': '[补考]',
  '●': '[重修]',
  '★': '[二专业]',
} as const;
const SYMBOLS = Object.keys(SYMBOLS_MAP);
const SYMBOLS_REGEX = new RegExp(`[${SYMBOLS.join('')}]`, 'g');

// 根据特殊字符映射标签
const getCourseName = (name: string) =>
  name
    .replace(SYMBOLS_REGEX, symbol =>
      symbol in SYMBOLS_MAP ? SYMBOLS_MAP[symbol as keyof typeof SYMBOLS_MAP] : symbol,
    )
    .trim();

// 辅助函数：合并考试数据与选课数据
const mergeData = (examData: ExamData, courseData: CourseData): MergedData[] => {
  const merged: MergedData[] = [];

  // 对课程数据分别以name字段为基础进行去重 (补考会使课程数据存在重复项)
  courseData = courseData.filter((course, index, self) => self.findIndex(c => c.name === course.name) === index);

  console.log(examData, courseData);

  // 以课程数据为主，若考试数据存在则覆盖相应字段
  courseData.forEach(course => {
    const exam = examData.find(e => e.name === course.name);
    merged.push({
      name: course.name,
      date: exam ? exam.date : null,
      location: exam ? exam.location : null,
      teacher: exam ? exam.teacher : course.teacher,
      time: exam ? exam.time : null,
    });
  });

  // 补充存在考试数据但课程数据中未出现的项
  examData.forEach(exam => {
    if (!merged.some(item => item.name === exam.name)) {
      merged.push({
        name: exam.name,
        date: exam.date,
        location: exam.location,
        teacher: exam.teacher,
        time: exam.time,
      });
    }
  });

  return merged;
};

export default function ExamRoomPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [termList, setTermList] = useState<string[]>([]);
  const [currentTerm, setCurrentTerm] = useState<string>('');
  const [examDataMap, setExamDataMap] = useState<Record<string, MergedData[]>>({});

  const { handleError } = useSafeResponseSolve();

  // 统一错误处理
  const handleApiError = useCallback(
    (error: any) => {
      const data = handleError(error);
      if (data) {
        toast.error(data.msg || '未知错误');
      }
      return [];
    },
    [handleError],
  );

  // 获取学期列表，并设置当前学期
  const fetchTermList = useCallback(async () => {
    try {
      const termResult = await getApiV1JwchTermList();
      const terms = termResult.data.data as string[];
      setTermList(terms);
      if (!currentTerm || (terms.length > 0 && !terms.includes(currentTerm))) {
        setCurrentTerm(terms[0] || '');
      }
    } catch (error: any) {
      handleApiError(error);
    }
  }, [currentTerm, handleApiError]);

  // 并行获取考试数据和课程数据，并合并后返回排序结果
  const fetchExamData = useCallback(
    async (term: string) => {
      const [examData, courseData] = await Promise.all([
        getApiV1JwchClassroomExam({ term })
          .then(res => res.data.data as ExamData)
          .catch(handleApiError),
        getApiV1JwchCourseList({ term })
          .then(res => res.data.data as CourseData)
          .catch(handleApiError),
      ]);
      const mergedList = mergeData(examData, courseData);
      // 根据考试日期排序，如果没有日期则置于后面
      return mergedList.sort((a, b) => {
        if (a.date && b.date) return b.date.localeCompare(a.date);
        return a.date ? -1 : 1;
      });
    },
    [handleApiError],
  );

  // 刷新当前学期数据
  const refreshCurrentExamData = useCallback(async () => {
    if (isRefreshing || !currentTerm) return;
    setIsRefreshing(true);
    const mergedData = await fetchExamData(currentTerm);
    setExamDataMap(prev => ({ ...prev, [currentTerm]: mergedData }));
    setIsRefreshing(false);
  }, [currentTerm, fetchExamData, isRefreshing]);

  // 初次加载学期列表
  useEffect(() => {
    fetchTermList();
  }, [fetchTermList]);

  // 切换学期时若没有缓存则获取数据
  useEffect(() => {
    if (currentTerm && !examDataMap[currentTerm]) {
      refreshCurrentExamData();
    }
  }, [currentTerm, examDataMap, refreshCurrentExamData]);

  return (
    <>
      <Stack.Screen options={{ title: NAVIGATION_TITLE }} />
      <ScrollView className="px-4">
        <Tabs value={currentTerm} onValueChange={setCurrentTerm}>
          <TabsList className="w-full flex-row">
            {termList.map((term, index) => (
              <TabsTrigger key={index} value={term} className="items-center">
                <Text>{term}</Text>
              </TabsTrigger>
            ))}
          </TabsList>
          {termList.map((term, index) => (
            <TabsContent key={index} value={term}>
              {examDataMap[term] ? (
                examDataMap[term].map((item, idx) => (
                  <Card key={idx} className="mb-2">
                    <Text>
                      {getCourseName(item.name)} - {item.teacher}
                    </Text>
                    <Text>
                      {item.date || '未定'} - {item.location || '未定'}
                    </Text>
                  </Card>
                ))
              ) : (
                <View className="p-4">
                  <Text>加载中...</Text>
                </View>
              )}
            </TabsContent>
          ))}
        </Tabs>
        <Button onPress={refreshCurrentExamData} disabled={isRefreshing} className="mt-2">
          <Text>{isRefreshing ? '刷新中...' : '刷新'}</Text>
        </Button>
      </ScrollView>
      <Stack.Screen />
    </>
  );
}
