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
  date?: Date;
  location?: string;
  teacher: string;
  time?: string;
  isFinished: boolean;
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

// 将日期字符串转换为 Date 对象，如转换失败返回 undefined
const parseDate = (dateStr: string): Date | undefined => {
  const match = dateStr.match(/(\d{4})年(\d{2})月(\d{2})日/);
  return match ? new Date(`${match[1]}-${match[2]}-${match[3]}`) : undefined;
};

// 辅助函数：合并考试数据与选课数据
const mergeData = (examData: ExamData, courseData: CourseData): MergedData[] => {
  const courseMap = new Map<string, CourseData[number]>(courseData.map(course => [course.name, course]));
  const examMap = new Map<string, ExamData[number]>(examData.map(exam => [exam.name, exam]));
  const allNames = [...new Set([...courseMap.keys(), ...examMap.keys()])];
  const now = new Date();

  return allNames
    .map(name => {
      // 从课程数据和考试数据中获取信息
      const course = courseMap.get(name);
      const exam = examMap.get(name);
      return {
        name,
        date: exam ? parseDate(exam.date) : undefined,
        location: exam ? exam.location : undefined,
        teacher: exam ? exam.teacher : course?.teacher || '',
        time: exam ? exam.time : undefined,
        // 判断是否已经结束，如果没有考试数据则默认为已结束，如果有考试数据则判断是否已经过了考试日期
        isFinished: exam ? (exam.date ? now > parseDate(exam.date)! : false) : true,
      };
    })
    .sort((a, b) => {
      // 按照日期排序，未知日期的排在最后
      if (a.date && b.date) return b.date.getTime() - a.date.getTime();
      return a.date ? -1 : 1;
    });
};

const formatDate = (date?: Date) => (date ? date.toLocaleDateString() : '未定');

export default function ExamRoomPage() {
  const [isRefreshing, setIsRefreshing] = useState(false); // 是否正在刷新
  const [termList, setTermList] = useState<string[]>([]); // 学期列表
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期
  const [examDataMap, setExamDataMap] = useState<Record<string, MergedData[]>>({}); // 考试数据
  const { handleError } = useSafeResponseSolve(); // 错误处理函数

  // 处理 API 错误
  const handleApiError = useCallback(
    (error: any) => {
      const data = handleError(error);
      if (data) toast.error(data.msg || '未知错误');
    },
    [handleError],
  );

  // 获取学期列表
  const fetchTermList = useCallback(async () => {
    try {
      const termResult = await getApiV1JwchTermList();
      const terms = termResult.data.data as string[];
      setTermList(terms);
      if (!currentTerm || (terms.length && !terms.includes(currentTerm))) {
        setCurrentTerm(terms[0] || '');
      }
    } catch (error: any) {
      handleApiError(error);
    }
  }, [currentTerm, handleApiError]);

  // 获取考试数据
  const fetchExamData = useCallback(
    async (term: string) => {
      try {
        const [examData, courseData] = await Promise.all([
          // 获取考试数据和选课数据
          getApiV1JwchClassroomExam({ term }).then(res => res.data.data as ExamData),
          getApiV1JwchCourseList({ term }).then(res => res.data.data as CourseData),
        ]);
        const mergedList = mergeData(examData, courseData);
        return mergedList;
      } catch (error: any) {
        handleApiError(error);
        return [];
      }
    },
    [handleApiError],
  );

  const refreshCurrentExamData = useCallback(async () => {
    if (isRefreshing || !currentTerm) return;
    setIsRefreshing(true);
    const mergedData = await fetchExamData(currentTerm);
    setExamDataMap(prev => ({ ...prev, [currentTerm]: mergedData }));
    setIsRefreshing(false);
  }, [currentTerm, fetchExamData, isRefreshing]);

  useEffect(() => {
    fetchTermList();
  }, [fetchTermList]);
  useEffect(() => {
    if (currentTerm && !examDataMap[currentTerm]) refreshCurrentExamData();
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
                  <Card key={idx} className="mb-2" style={{ opacity: item.isFinished ? 0.5 : 1 }}>
                    <Text>
                      {getCourseName(item.name)} - {item.teacher}
                    </Text>
                    <Text>
                      {formatDate(item.date)} - {item.location || '未定'}
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
