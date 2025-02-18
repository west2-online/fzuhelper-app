import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import FAQModal from '@/components/FAQModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';

import type { JwchCourseListResponse as CourseData, JwchClassroomExamResponse as ExamData } from '@/api/backend';
import { ResultEnum } from '@/api/enum';
import { getApiV1JwchClassroomExam, getApiV1JwchCourseList, getApiV1JwchTermList } from '@/api/generate';
import { ThemedView } from '@/components/ThemedView';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { FAQ_EXAME_ROOM } from '@/lib/FAQ';
import { COURSE_DATA_KEY } from '@/lib/constants';
import { cn } from '@/lib/utils';

// 合并后列表项结构 由于考试数据和选课数据的字段不同，需要合并后再展示
// 存在考试的科目，优先使用考试数据，否则使用选课数据
interface MergedExamData {
  name: string; // 课程名
  credit: string; // 学分
  teacher: string; // 授课教师
  date?: Date; // 考试日期
  location?: string; // 考场位置
  time?: string; // 考试时间
  isFinished: boolean; // 是否已经结束
}

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

// 辅助函数：合并考试数据与选课数据(考试数据优先)
const mergeData = (examData: ExamData, courseData: CourseData): MergedExamData[] => {
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
        credit: exam ? exam.credit : '0',
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

interface CourseCardProps {
  item: MergedExamData;
}

// 课程卡片
const CourseCard: React.FC<CourseCardProps> = ({ item }) => (
  <Card className={cn('m-1 p-3', item.isFinished && 'opacity-50')}>
    {/* 考试课程 */}
    <View className="m-1 flex flex-row items-center">
      <Ionicons name={item.isFinished ? 'checkmark-circle' : 'alert-circle'} size={16} className="mr-2" />
      <Text className="flex-1 font-bold">
        {getCourseName(item.name)}
        {item.credit !== undefined && item.credit !== '0' && (
          <Text className="text-sm text-muted-foreground"> （{item.credit} 学分）</Text>
        )}
      </Text>
      <Text>{item.teacher.length > 10 ? item.teacher.slice(0, 10) + '...' : item.teacher}</Text>
    </View>

    {/* 分割线 */}
    {(item.date || item.time || item.location) && <View className="m-1 border-b border-border" />}

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
  const [mergedDataMap, setMergedDataMap] = useState<Record<string, { data: MergedExamData[]; lastUpdated?: Date }>>(
    {},
  );

  const { handleError } = useSafeResponseSolve();
  const [showFAQ, setShowFAQ] = useState(false); // 是否显示 FAQ

  // 处理API错误
  const handleApiError = useCallback(
    (error: any) => {
      const data = handleError(error);

      if (data) {
        if (data.code === ResultEnum.BizErrorCode) {
          // toast('当前学期还没有考试');
          return;
        }
        toast.error(data.message || '发生未知错误，请稍后再试');
      }
    },
    [handleError],
  );

  // 获取学期列表（当前用户），此处不使用 usePersistedQuery
  // 这和课表的 getApiV1TermsList 不一致，前者（即 getApiV1JwchTermList）只返回用户就读的学期列表
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

  // 使用本地缓存的课程数据
  const { data: courseData } = usePersistedQuery({
    queryKey: [COURSE_DATA_KEY, currentTerm],
    queryFn: () => getApiV1JwchCourseList({ term: currentTerm }),
    cacheTime: 7 * 1000 * 60 * 60 * 24, // 缓存 7 天
  });

  // 刷新当前学期数据并更新合并数据
  const refreshData = useCallback(async () => {
    if (isRefreshing || !currentTerm) return;
    setIsRefreshing(true);

    // 清空当前学期的数据，保留对象结构
    setMergedDataMap(prev => ({
      ...prev,
      [currentTerm]: { data: [], lastUpdated: undefined },
    }));

    // 获取最新的考试数据
    const newExamData = await getApiV1JwchClassroomExam({ term: currentTerm })
      .then(res => res.data.data as ExamData)
      .catch(error => {
        handleApiError(error);
        return [] as ExamData;
      });
    const mergedData = mergeData(newExamData, courseData?.data?.data || []);
    setMergedDataMap(prev => ({
      ...prev,
      [currentTerm]: {
        data: mergedData,
        lastUpdated: new Date(), // 记录刷新时间
      },
    }));

    setIsRefreshing(false);
  }, [isRefreshing, currentTerm, courseData?.data?.data, handleApiError]);

  // 加载学期列表
  useEffect(() => {
    fetchTermList();
  }, [fetchTermList]);

  // 当 currentTerm 变化或 examDataMap 缺少数据时刷新
  useEffect(() => {
    if (currentTerm && !mergedDataMap[currentTerm]) {
      refreshData();
    }
  }, [currentTerm, mergedDataMap, refreshData]);

  // 处理 Modal 显示事件
  const handleModalVisible = useCallback(() => {
    console.log('FAQ');
    setShowFAQ(prev => !prev);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitleAlign: 'center',
          headerTitle: '考场',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <Pressable onPress={handleModalVisible} className="flex flex-row items-center">
              <Ionicons name="help-circle-outline" size={26} className="mr-4" />
            </Pressable>
          ),
        }}
      />

      <ThemedView>
        <ScrollView
          className="px-4"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />}
        >
          <Tabs value={currentTerm} onValueChange={setCurrentTerm}>
            {/* 可横向滚动的表头，防止学期过多导致显示问题 */}
            <ScrollView className="pt-4" horizontal showsHorizontalScrollIndicator={false}>
              <TabsList className="flex-row">
                {/* 生成学期表头 */}
                {termList.map((term, index) => (
                  <TabsTrigger key={index} value={term} className="items-center">
                    <Text className="w-24 text-center">{term}</Text>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollView>

            {/* 生成考试卡片 */}
            {termList.map(term => (
              <TabsContent key={term} value={term}>
                {/* 显示刷新时间 */}
                {mergedDataMap[term]?.lastUpdated && (
                  <View className="mb-2 flex flex-row items-center rounded-lg bg-gray-100 p-2">
                    <Ionicons name="time-outline" size={16} className="mr-2 text-gray-500" />
                    <Text className="text-sm leading-5 text-gray-600">
                      数据同步时间：{mergedDataMap[term].lastUpdated.toLocaleString()}
                    </Text>
                  </View>
                )}
                {/* 渲染考试数据 */}
                <SafeAreaView edges={['bottom']}>
                  {mergedDataMap[term]?.data ? (
                    mergedDataMap[term].data.map((item, idx) => <CourseCard key={idx} item={item} />)
                  ) : (
                    <Text>加载中...</Text>
                  )}
                </SafeAreaView>
              </TabsContent>
            ))}
          </Tabs>
        </ScrollView>

        {/* FAQ Modal */}
        <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} data={FAQ_EXAME_ROOM} />
      </ThemedView>
    </>
  );
}
