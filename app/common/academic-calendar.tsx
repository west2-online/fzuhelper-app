import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Icon } from '@/components/Icon';
import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';
import { Text } from '@/components/ui/text';

import { ResultEnum } from '@/api/enum';
import { getApiV1TermsInfo, getApiV1TermsList } from '@/api/generate';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { type AcademicCalendar } from '@/types/calendar';

export default function AcademicCalendarPage() {
  const [isRefreshing, setIsRefreshing] = useState(false); // 是否正在刷新
  const [termList, setTermList] = useState<string[]>([]); // 学期列表
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期
  const [academicCalendarDataMap, setAcademicCalendarMap] = useState<
    Record<string, { data: AcademicCalendar[]; lastUpdated?: Date }>
  >({});
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
      const result = await getApiV1TermsList();
      const terms = result.data.data.terms.map(item => item.term) as string[];
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
    // 清空当前学期的数据，保留对象结构
    setAcademicCalendarMap(prev => ({
      ...prev,
      [currentTerm]: { data: [], lastUpdated: undefined },
    }));

    try {
      const result = await getApiV1TermsInfo({ term: currentTerm });

      setAcademicCalendarMap(prev => ({
        ...prev,
        [currentTerm]: {
          data: result.data.data.events as AcademicCalendar[],
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
    if (!isRefreshing && currentTerm && !academicCalendarDataMap[currentTerm]) {
      setIsRefreshing(true);
      refreshData();
    }
  }, [isRefreshing, currentTerm, academicCalendarDataMap, refreshData]);

  // 处理下拉刷新逻辑
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refreshData();
  }, [refreshData]);

  // 渲染每个学期的内容
  const renderContent = (term: string) => {
    const termData = academicCalendarDataMap[term]?.data || [];
    const lastUpdated = academicCalendarDataMap[term]?.lastUpdated;

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
                <LabelEntry
                  leftText={item.name}
                  description={item.start_date + ' - ' + item.end_date}
                  disabled
                  noIcon
                />
              </View>
            ))
          ) : (
            <Text className="text-center text-text-secondary">{isRefreshing ? '正在刷新中' : '暂无学期数据'}</Text>
          )}
        </SafeAreaView>

        {/* 显示刷新时间 */}
        {lastUpdated && (
          <View className="my-4 flex flex-row items-center justify-center">
            <Icon name="time-outline" size={16} className="mr-2" />
            <Text className="text-sm leading-5 text-text-primary">数据同步时间：{lastUpdated.toLocaleString()}</Text>
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
          headerTitle: '校历',
        }}
      />

      <PageContainer>
        <TabFlatList data={termList} value={currentTerm} onChange={setCurrentTerm} renderContent={renderContent} />
      </PageContainer>
    </>
  );
}
