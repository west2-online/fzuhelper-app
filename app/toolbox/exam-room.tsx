import type { JwchCourseListResponse as CourseData, JwchClassroomExamResponse as ExamData } from '@/api/backend';
import { ResultEnum } from '@/api/enum';
import { getApiV1JwchClassroomExam, getApiV1JwchCourseList, getApiV1JwchTermList } from '@/api/generate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { COURSE_DATA_KEY } from '@/lib/constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

interface MergedExamData {
  name: string;
  teacher: string;
  date?: Date;
  location?: string;
  time?: string;
  isFinished: boolean;
}

const NAVIGATION_TITLE = '考场';

const SYMBOLS_MAP = {
  '▲': '[补考]',
  '●': '[重修]',
  '★': '[二专业]',
} as const;
const SYMBOLS = Object.keys(SYMBOLS_MAP);
const SYMBOLS_REGEX = new RegExp(`[${SYMBOLS.join('')}]`, 'g');

const getCourseName = (name: string) =>
  name
    .replace(SYMBOLS_REGEX, symbol =>
      symbol in SYMBOLS_MAP ? SYMBOLS_MAP[symbol as keyof typeof SYMBOLS_MAP] : symbol,
    )
    .trim();

const parseDate = (dateStr: string): Date | undefined => {
  const match = dateStr.match(/(\d{4})年(\d{2})月(\d{2})日/);
  return match ? new Date(`${match[1]}-${match[2]}-${match[3]}`) : undefined;
};

const mergeData = (examData: ExamData, courseData: CourseData): MergedExamData[] => {
  const courseMap = new Map<string, CourseData[number]>(courseData.map(course => [course.name, course]));
  const examMap = new Map<string, ExamData[number]>(examData.map(exam => [exam.name, exam]));
  const allNames = [...new Set([...courseMap.keys(), ...examMap.keys()])];
  const now = new Date();

  return allNames
    .map(name => {
      const course = courseMap.get(name);
      const exam = examMap.get(name);
      return {
        name,
        teacher: exam ? exam.teacher : course?.teacher || '',
        date: exam ? parseDate(exam.date) : undefined,
        location: exam ? exam.location : undefined,
        time: exam ? exam.time : undefined,
        isFinished: exam ? (exam.date ? now > parseDate(exam.date)! : false) : true,
      };
    })
    .sort((a, b) => {
      if (a.date && b.date) return b.date.getTime() - a.date.getTime();
      return a.date ? -1 : 1;
    });
};

const formatDate = (date?: Date) => (date ? date.toLocaleDateString() : undefined);

const generateCourseCard = (item: MergedExamData) => (
  <Card className={`m-1 p-3 ${item.isFinished ? 'opacity-50' : ''}`}>
    <View className="m-1 flex flex-row items-center">
      <Ionicons name={item.isFinished ? 'checkmark-circle' : 'alert-circle'} size={16} className="mr-2" />
      <Text className="flex-1 font-bold">{getCourseName(item.name)}</Text>
      <Text>{item.teacher.length > 10 ? item.teacher.slice(0, 10) + '...' : item.teacher}</Text>
    </View>
    {(item.date || item.time || item.location) && <View className="m-1 border-b border-gray-300" />}
    {(item.date || item.time) && (
      <View className="m-1 flex flex-row items-center">
        <Ionicons name="calendar" size={16} className="mr-2" />
        {item.date && <Text>{formatDate(item.date)} </Text>}
        {item.time && <Text>{item.time}</Text>}
      </View>
    )}
    {item.location && (
      <View className="m-1 flex flex-row items-center">
        <Ionicons name="location" size={16} className="mr-2" />
        <Text>{item.location}</Text>
      </View>
    )}
  </Card>
);

export default function ExamRoomPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [termList, setTermList] = useState<string[]>([]);
  const [currentTerm, setCurrentTerm] = useState<string>('');
  const [examDataMap, setExamDataMap] = useState<Record<string, MergedExamData[]>>({});
  const handleErrorRef = useRef(useSafeResponseSolve().handleError);

  const handleApiError = useCallback((error: any) => {
    const data = handleErrorRef.current(error);
    if (data) {
      if (data.code === ResultEnum.BizErrorCode) {
        toast('当前学期还没有考试');
        return;
      }
      toast.error(data.message || '发生未知错误，请稍后再试');
    }
  }, []);

  // 获取学期列表
  const fetchTermList = useCallback(async () => {
    try {
      const result = await getApiV1JwchTermList();
      const terms = result.data.data as string[];
      setTermList(terms);
      if (!currentTerm && terms.length) {
        setCurrentTerm(terms[0]);
      }
    } catch (error: any) {
      handleApiError(error);
    }
  }, [currentTerm, handleApiError]);

  // 使用缓存的课程数据
  const { data: courseData } = usePersistedQuery({
    queryKey: [COURSE_DATA_KEY, currentTerm],
    queryFn: () => getApiV1JwchCourseList({ term: currentTerm }),
    cacheTime: 7 * 1000 * 60 * 60 * 24,
  });


  // 刷新当前学期数据并更新合并数据
  const refreshData = useCallback(async () => {
    if (isRefreshing || !currentTerm) return;
    setIsRefreshing(true);
    // 获取考试数据
    const newExamData = await getApiV1JwchClassroomExam({ term: currentTerm })
      .then(res => res.data.data as ExamData)
      .catch(error => {
        handleApiError(error);
        return [] as ExamData;
      });
    const mergedData = mergeData(newExamData, courseData?.data?.data || []);
    setExamDataMap(prev => ({ ...prev, [currentTerm]: mergedData }));

    setIsRefreshing(false);
  }, [currentTerm, courseData, isRefreshing]);

  // 加载学期列表
  useEffect(() => {
    fetchTermList();
  }, [fetchTermList]);

  // 当 currentTerm 变化或 examDataMap 缺少数据时刷新
  useEffect(() => {
    if (currentTerm && !examDataMap[currentTerm]) {
      refreshData();
    }
  }, [currentTerm, examDataMap, refreshData]);

  return (
    <>
      <Stack.Screen options={{ title: NAVIGATION_TITLE }} />
      <ScrollView className="p-4">
        <Tabs value={currentTerm} onValueChange={setCurrentTerm}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TabsList className="flex-row">
              {termList.map((term, index) => (
                <TabsTrigger key={index} value={term} className="items-center">
                  <Text className="w-24 text-center">{term}</Text>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollView>
          {termList.map((term, index) => (
            <TabsContent key={index} value={term}>
              {examDataMap[term] ? examDataMap[term].map(item => generateCourseCard(item)) : <Text>加载中...</Text>}
            </TabsContent>
          ))}
        </Tabs>
        <Button onPress={refreshData} disabled={isRefreshing} className="mb-10">
          <Text>{isRefreshing ? '刷新中...' : '刷新'}</Text>
        </Button>
      </ScrollView>
    </>
  );
}
