import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import FAQModal from '@/components/FAQModal';
import ExamRoomCard from '@/components/academic/ExamRoomCard';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';
import { Text } from '@/components/ui/text';

import type { JwchClassroomExamResponse as ExamData } from '@/api/backend';
import { ResultEnum } from '@/api/enum';
import { getApiV1JwchClassroomExam, getApiV1JwchTermList } from '@/api/generate';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { FAQ_EXAME_ROOM } from '@/lib/FAQ';
import type { MergedExamData } from '@/types/academic';

// 将日期字符串(xxxx年xx月xx日)转换为 Date 对象，如转换失败返回 undefined
const parseDate = (dateStr: string): Date | undefined => {
  const match = dateStr.match(/(\d{4})年(\d{2})月(\d{2})日/);
  return match ? new Date(`${match[1]}-${match[2]}-${match[3]}`) : undefined;
};

// 格式化考试数据
const formatExamData = (examData: ExamData): MergedExamData[] => {
  const now = new Date();

  return examData
    .map(exam => ({
      name: exam.name,
      credit: exam.credit || '0',
      teacher: exam.teacher || '',
      date: parseDate(exam.date),
      location: exam.location || undefined,
      time: exam.time || undefined,
      isFinished: exam.date ? now > parseDate(exam.date)! : false,
    }))
    .sort((a, b) => {
      // 按照日期排序，未知日期的排在最后
      if (a.date && b.date) return b.date.getTime() - a.date.getTime();
      return a.date ? -1 : 1;
    });
};

export default function ExamRoomPage() {
  const [isRefreshing, setIsRefreshing] = useState(false); // 是否正在刷新
  const [termList, setTermList] = useState<string[]>([]); // 学期列表
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期
  const [examDataMap, setExamDataMap] = useState<Record<string, { data: MergedExamData[]; lastUpdated?: Date }>>({});
  const [showFAQ, setShowFAQ] = useState(false); // 是否显示 FAQ
  const screenWidth = Dimensions.get('window').width; // 获取屏幕宽度

  const handleErrorRef = useRef(useSafeResponseSolve().handleError);

  // 处理API错误
  const handleApiError = useCallback(
    (error: any) => {
      const data = handleErrorRef.current(error);

      if (data) {
        if (data.code === ResultEnum.BizErrorCode) {
          return;
        }
        toast.error(data.message || '发生未知错误，请稍后再试');
      }
    },
    [handleErrorRef],
  );

  // 获取学期列表（当前用户）
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

  // 刷新当前学期数据
  const refreshData = useCallback(async () => {
    console.log('Refreshing exam data...');
    // 清空当前学期的数据，保留对象结构
    setExamDataMap(prev => ({
      ...prev,
      [currentTerm]: { data: [], lastUpdated: undefined },
    }));

    try {
      const newExamData = await getApiV1JwchClassroomExam({ term: currentTerm });
      const formattedData = formatExamData(newExamData.data.data as ExamData);

      setExamDataMap(prev => ({
        ...prev,
        [currentTerm]: {
          data: formattedData,
          lastUpdated: new Date(), // 记录刷新时间
        },
      }));
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentTerm, handleApiError]);

  // 加载学期列表
  useEffect(() => {
    fetchTermList();
  }, [fetchTermList]);

  // 当 currentTerm 变化或 examDataMap 缺少数据时刷新
  useEffect(() => {
    if (!isRefreshing && currentTerm && !examDataMap[currentTerm]) {
      setIsRefreshing(true);
      refreshData();
    }
  }, [isRefreshing, currentTerm, examDataMap, refreshData]);

  // 处理 Modal 显示事件
  const handleModalVisible = useCallback(() => {
    setShowFAQ(prev => !prev);
  }, []);

  // 处理下拉刷新逻辑
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refreshData();
  }, [refreshData]);

  // 渲染每个学期的内容
  const renderContent = (term: string) => {
    const termData = examDataMap[term]?.data || [];
    const lastUpdated = examDataMap[term]?.lastUpdated;

    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        className="grow"
        style={{ width: screenWidth }}
      >
        {/* 渲染考试数据 */}
        <SafeAreaView edges={['bottom']}>
          {termData.length > 0 ? (
            termData.map((item, idx) => (
              <View key={idx} className="mx-4">
                <ExamRoomCard item={item} />
              </View>
            ))
          ) : (
            <Text className="text-center text-gray-500">{isRefreshing ? '正在刷新中' : '暂无考试数据'}</Text>
          )}
        </SafeAreaView>

        {/* 显示刷新时间 */}
        {lastUpdated && (
          <View className="my-4 flex flex-row items-center justify-center">
            <Ionicons name="time-outline" size={16} className="mr-2 text-gray-500" />
            <Text className="text-sm leading-5 text-gray-600">数据同步时间：{lastUpdated.toLocaleString()}</Text>
          </View>
        )}
      </ScrollView>
    );
  };

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

      <PageContainer>
        <TabFlatList data={termList} value={currentTerm} onChange={setCurrentTerm} renderContent={renderContent} />
      </PageContainer>

      {/* FAQ Modal */}
      <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} data={FAQ_EXAME_ROOM} />
    </>
  );
}
