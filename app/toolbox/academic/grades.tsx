import { Tabs } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import FAQModal from '@/components/FAQModal';
import { Icon } from '@/components/Icon';
import GradeCard from '@/components/academic/GradeCard';
import SemesterSummaryCard from '@/components/academic/SemesterSummaryCard';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';
import { Text } from '@/components/ui/text';

import { getApiV1JwchAcademicScores, getApiV1JwchTermList } from '@/api/generate';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { FAQ_COURSE_GRADE } from '@/lib/FAQ';
import { calSingleTermSummary, parseScore } from '@/lib/grades';
import type { CourseGradesData } from '@/types/academic';

export default function GradesPage() {
  const [isRefreshing, setIsRefreshing] = useState(true); // 按钮是否禁用
  const [termList, setTermList] = useState<string[]>([]); // 学期列表
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期
  const [academicData, setAcademicData] = useState<CourseGradesData[]>([]); // 学术成绩数据
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null); // 最后更新时间
  const [showFAQ, setShowFAQ] = useState(false); // 是否显示 FAQ 模态框

  const handleErrorRef = useRef(useSafeResponseSolve().handleError);
  const screenWidth = Dimensions.get('window').width; // 获取屏幕宽度

  // 访问 west2-online 服务器获取成绩数据（由于教务处限制，只能获取全部数据）
  // 由于教务处限制，成绩数据会直接返回所有课程的成绩，我们需要在本地进行区分，因此引入了下一个获取学期列表的函数
  const getAcademicData = useCallback(async () => {
    try {
      const result = await getApiV1JwchAcademicScores();
      setAcademicData(result.data.data);
      setLastUpdated(new Date()); // 更新最后更新时间
    } catch (error: any) {
      console.log(error);
      const data = handleErrorRef.current(error);
      if (data) {
        toast.error(data.message || '发生未知错误，请稍后再试');
      }
    } finally {
      setIsRefreshing(false); // 确保结束刷新
    }
  }, []);

  // 获取学期列表（当前用户），此处不使用 usePersistedQuery
  // 这和课表的 getApiV1TermsList 不一致，前者（即 getApiV1JwchTermList）只返回用户就读的学期列表
  const fetchTermList = useCallback(async () => {
    try {
      const result = await getApiV1JwchTermList();
      const terms = result.data.data as string[];
      setTermList(terms);
      // 只在首次加载（terms 存在且 currentTerm 为空）时设置 currentTerm
      if (terms.length > 0 && !currentTerm) {
        setCurrentTerm(terms[0]);
      }
    } catch (error: any) {
      const data = handleErrorRef.current(error);
      if (data) {
        toast.error(data.message || '发生未知错误，请稍后再试');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 移除 currentTerm 依赖，避免重复获取

  // 分离初始化加载逻辑
  useEffect(() => {
    fetchTermList();
    getAcademicData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  // 处理下拉刷新逻辑
  const handleRefresh = useCallback(() => {
    if (!isRefreshing) {
      setIsRefreshing(true); // 确保不会重复触发刷新
      setAcademicData([]); // 清空数据
      getAcademicData();
    }
  }, [setAcademicData, getAcademicData, isRefreshing]);

  // 处理 Modal 显示事件
  const handleModalVisible = useCallback(() => {
    setShowFAQ(prev => !prev);
  }, []);

  // 渲染单个学期的内容
  const renderTermContent = (term: string) => {
    const filteredData = academicData.filter(it => it.term === term);
    const summary = calSingleTermSummary(filteredData, term);

    return (
      <ScrollView
        style={{ width: screenWidth }}
        // eslint-disable-next-line react-native/no-inline-styles
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              if (!isRefreshing) {
                handleRefresh();
              }
            }}
          />
        }
      >
        {filteredData.length > 0 && summary && (
          <View className="mx-4">
            <SemesterSummaryCard summary={summary} />
          </View>
        )}

        <SafeAreaView edges={['bottom']}>
          {filteredData.length > 0 ? (
            filteredData
              .sort((a, b) => parseScore(b.score) - parseScore(a.score))
              .map((item, index) => (
                <View key={index} className="mx-4 mt-4">
                  <GradeCard item={item} />
                </View>
              ))
          ) : (
            <Text className="text-center text-gray-500">暂无成绩数据</Text>
          )}
          {academicData.length > 0 && (
            <View className="my-4 flex flex-row items-center justify-center">
              <Icon name="time-outline" size={16} className="mr-2" />
              <Text className="text-sm leading-5 text-text-primary">
                数据同步时间：{(lastUpdated && lastUpdated.toLocaleString()) || '请进行一次同步'}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </ScrollView>
    );
  };

  return (
    <>
      <Tabs.Screen
        options={{
          title: '成绩查询',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <Pressable onPress={handleModalVisible} className="flex flex-row items-center">
              <Icon name="help-circle-outline" size={26} className="mr-4" />
            </Pressable>
          ),
        }}
      />

      <PageContainer>
        {isRefreshing ? (
          <Loading />
        ) : (
          <TabFlatList
            data={termList}
            value={currentTerm}
            onChange={setCurrentTerm}
            renderContent={renderTermContent}
          />
        )}

        {/* FAQ Modal */}
        <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} data={FAQ_COURSE_GRADE} />
      </PageContainer>
    </>
  );
}
