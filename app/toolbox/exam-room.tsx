import type { JwchCourseListResponse as CourseData, JwchClassroomExamResponse as ExamData } from '@/api/backend';
import { ResultEnum } from '@/api/enum';
import { getApiV1JwchClassroomExam, getApiV1JwchCourseList, getApiV1JwchTermList } from '@/api/generate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';
// 合并后列表项结构 由于考试数据和选课数据的字段不同，需要合并后再展示
// 存在考试的科目，优先使用考试数据，否则使用选课数据
interface MergedExamData {
  name: string;
  teacher: string;
  date?: Date; // 考试日期
  location?: string; // 考场位置
  time?: string; // 考试时间
  isFinished: boolean; // 是否已经结束
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

// 将日期字符串(xxxx年xx月xx日)转换为 Date 对象，如转换失败返回 undefined
const parseDate = (dateStr: string): Date | undefined => {
  const match = dateStr.match(/(\d{4})年(\d{2})月(\d{2})日/);
  return match ? new Date(`${match[1]}-${match[2]}-${match[3]}`) : undefined;
};

// 辅助函数：合并考试数据与选课数据
const mergeData = (examData: ExamData, courseData: CourseData): MergedExamData[] => {
  const courseMap = new Map<string, CourseData[number]>(courseData.map(course => [course.name, course]));
  const examMap = new Map<string, ExamData[number]>(examData.map(exam => [exam.name, exam]));
  const allNames = [...new Set([...courseMap.keys(), ...examMap.keys()])]; // 获取所有课程名
  const now = new Date();

  return allNames
    .map(name => {
      // 从课程数据和考试数据中获取信息
      const course = courseMap.get(name);
      const exam = examMap.get(name);
      return {
        name,
        teacher: exam ? exam.teacher : course?.teacher || '',
        date: exam ? parseDate(exam.date) : undefined,
        location: exam ? exam.location : undefined,
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

// 格式化日期
const formatDate = (date?: Date) => (date ? date.toLocaleDateString() : undefined);

// 生成课程卡片
const generateCourseCard = (item: MergedExamData) => (
  <Card className={`m-1 p-3 ${item.isFinished ? 'opacity-50' : ''}`}>
    {/* 考试课程 */}
    <View className="m-1 flex flex-row items-center">
      <Ionicons name={item.isFinished ? 'checkmark-circle' : 'alert-circle'} size={16} className="mr-2" />
      <Text className="flex-1 font-bold">{getCourseName(item.name)}</Text>
      <Text>{item.teacher.length > 10 ? item.teacher.slice(0, 10) + '...' : item.teacher}</Text>
    </View>

    {/* 分割线 */}
    {(item.date || item.time || item.location) && <View className="m-1 border-b border-gray-300" />}

    {/* 日期 */}
    {(item.date || item.time) && (
      <View className="m-1 flex flex-row items-center">
        <Ionicons name="calendar" size={16} className="mr-2" />
        {item.date && <Text>{formatDate(item.date)} </Text>}
        {item.time && <Text>{item.time}</Text>}
      </View>
    )}

    {/* 考场位置 */}
    {item.location && (
      <View className="m-1 flex flex-row items-center">
        <Ionicons name="location" size={16} className="mr-2" />
        <Text>{item.location}</Text>
      </View>
    )}
  </Card>
);

export default function ExamRoomPage() {
  const [isRefreshing, setIsRefreshing] = useState(false); // 是否正在刷新
  const [termList, setTermList] = useState<string[]>([]); // 学期列表
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期
  const [examDataMap, setExamDataMap] = useState<Record<string, MergedExamData[]>>({}); // 考试数据
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
      const termResult = await getApiV1JwchTermList();
      const terms = termResult.data.data as string[];
      // debug,当学期列表太多/少时，查看ui是否正常
      // const terms = ['202402', '202401', '202302', '202301', '202202', '202201', '202102'];
      // const terms = ['202401'];
      setTermList(terms);
      if (!currentTerm && terms.length > 0) {
        setCurrentTerm(terms[0]);
      }
    } catch (error: any) {
      handleApiError(error);
    }
  }, [handleApiError, currentTerm]);

  // 并行获取考试数据和课程数据，并合并后返回排序结果;在api抛出错误时，返回空数组
  const fetchExamData = useCallback(
    async (term: string) => {
      const [examData, courseData] = await Promise.all([
        getApiV1JwchClassroomExam({ term })
          .then(res => res.data.data as ExamData)
          .catch(error => {
            handleApiError(error);
            return [] as ExamData;
          }),

        getApiV1JwchCourseList({ term })
          .then(res => res.data.data as CourseData)
          .catch(error => {
            handleApiError(error);
            return [] as CourseData;
          }),
      ]);
      return mergeData(examData, courseData);
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

  // 页面加载时获取学期列表
  useEffect(() => {
    fetchTermList();
  }, [fetchTermList]);

  // 切换学期时若没有缓存则获取数据
  useEffect(() => {
    if (currentTerm && !examDataMap[currentTerm]) refreshCurrentExamData();
  }, [currentTerm, examDataMap, refreshCurrentExamData]);

  return (
    <>
      <Stack.Screen options={{ title: NAVIGATION_TITLE }} />
      <ScrollView className="p-4">
        <Tabs value={currentTerm} onValueChange={setCurrentTerm}>
          {/* 列表可以横向滚动 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TabsList className="flex-row">
              {termList.map((term, index) => (
                <TabsTrigger key={index} value={term} className="items-center">
                  <Text className="w-24 text-center">{term}</Text>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollView>

          {/* 生成内容 */}
          {termList.map((term, index) => (
            <TabsContent key={index} value={term}>
              {examDataMap[term] ? examDataMap[term].map(item => generateCourseCard(item)) : <Text>加载中...</Text>}
            </TabsContent>
          ))}
        </Tabs>

        {/* 底部刷新按钮 (mb-10用来强行把button拉高，很奇怪，他的高度居然是按<Text>算的) */}
        <Button onPress={refreshCurrentExamData} disabled={isRefreshing} className="mb-10">
          <Text>{isRefreshing ? '刷新中...' : '刷新'}</Text>
        </Button>
      </ScrollView>
    </>
  );
}
