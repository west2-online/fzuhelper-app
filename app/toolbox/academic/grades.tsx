import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import GradeCard from '@/components/academic/GradeCard';
import SemesterSummaryCard from '@/components/academic/SemesterSummaryCard';
import FAQModal from '@/components/faq-modal';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';

import { JwchAcademicScoresResponse_AcademicScoresDataItem } from '@/api/backend';
import { getApiV1JwchAcademicScores, getApiV1JwchTermList } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import EmptyView from '@/components/multistateview/empty-view';
import MultiStateView, { STATE } from '@/components/multistateview/multi-state-view';
import useApiRequest from '@/hooks/useApiRequest';
import { FAQ_COURSE_GRADE } from '@/lib/FAQ';
import { GRADE_CACHE_KEY, JWCH_TERM_LIST_KEY } from '@/lib/constants';
import { calSingleTermSummary, parseScore } from '@/lib/grades';

interface TermContentProps {
  termData: JwchAcademicScoresResponse_AcademicScoresDataItem[];
  dataUpdatedAt: number;
  onRefresh?: () => void;
}

// 单个学期的内容
const TermContent = React.memo<TermContentProps>(({ termData, dataUpdatedAt, onRefresh }) => {
  const { width: screenWidth } = useWindowDimensions(); // 获取屏幕宽度
  const lastUpdated = useMemo(() => new Date(dataUpdatedAt), [dataUpdatedAt]);
  const summary = useMemo(() => calSingleTermSummary(termData), [termData]);
  const sortedTermData = useMemo(() => {
    return termData.sort((a, b) => parseScore(b.score) - parseScore(a.score));
  }, [termData]);
  const { bottom } = useSafeAreaInsets();
  const contentContainerStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);
  const [isLoading] = useState(false);
  const keyExtractor = useCallback(
    (item: JwchAcademicScoresResponse_AcademicScoresDataItem, index: number) => `${item.name}-${index}`,
    [],
  );

  const renderItem = useCallback(({ item }: { item: JwchAcademicScoresResponse_AcademicScoresDataItem }) => {
    return <GradeCard item={item} />;
  }, []);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const renderListHeaderComponent = useMemo(() => {
    return termData.length > 0 ? <SemesterSummaryCard summary={summary} /> : null;
  }, [termData.length, summary]);

  const renderListEmptyComponent = useMemo(() => {
    return <EmptyView className="-h-screen-safe-offset-12" />;
  }, []);

  const renderListFooterComponent = useMemo(() => {
    return termData.length > 0 ? <LastUpdateTime lastUpdated={lastUpdated} /> : null;
  }, [termData.length, lastUpdated]);

  const flatListStyle = useMemo(() => ({ width: screenWidth }), [screenWidth]);

  return (
    <FlatList
      data={sortedTermData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerClassName="mt-3 mx-4 gap-3"
      contentContainerStyle={contentContainerStyle}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
      ListHeaderComponent={renderListHeaderComponent}
      ListEmptyComponent={renderListEmptyComponent}
      ListFooterComponent={renderListFooterComponent}
      style={flatListStyle}
      windowSize={3}
      initialNumToRender={6}
    />
  );
});

TermContent.displayName = 'TermContent';

export default function GradesPage() {
  const [state, setState] = useState(STATE.LOADING);
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期

  // 获取学期列表（当前用户），此处不使用 usePersistedQuery
  // 这和课表的 getApiV1TermsList 不一致，前者（即 getApiV1JwchTermList）只返回用户就读的学期列表
  const {
    data: termList,
    isFetching: isFetchingTermList,
    isError: isErrorTermList,
    refetch: refetchTermList,
  } = useApiRequest(getApiV1JwchTermList, {}, { persist: true, queryKey: [JWCH_TERM_LIST_KEY] });

  // 访问 west2-online 服务器获取成绩数据（由于教务处限制，只能获取全部数据）
  // 由于教务处限制，成绩数据会直接返回所有课程的成绩，我们需要在本地进行区分，因此引入了下一个获取学期列表的函数
  const {
    data: academicData,
    dataUpdatedAt: academicDataUpdatedAt,
    isFetching: isFetchingAcademicData,
    isError: isErrorAcademicData,
    refetch: refetchAcademicData,
  } = useApiRequest(getApiV1JwchAcademicScores, {}, { persist: true, queryKey: [GRADE_CACHE_KEY] });

  // MultiStateView 状态管理
  useEffect(() => {
    if (isFetchingTermList || isFetchingAcademicData) {
      setState(STATE.LOADING);
    } else if (isErrorTermList || isErrorAcademicData) {
      setState(STATE.ERROR);
    } else if (!termList || termList.length === 0) {
      setState(STATE.EMPTY);
    } else {
      // 只在首次加载（terms 存在且 currentTerm 为空）时设置 currentTerm
      if (!currentTerm) {
        setCurrentTerm(termList[0]);
      }
      setState(STATE.CONTENT);
    }
  }, [isFetchingTermList, isFetchingAcademicData, isErrorTermList, isErrorAcademicData, termList, currentTerm]);

  const [showFAQ, setShowFAQ] = useState(false); // 是否显示 FAQ 模态框

  // 处理 Modal 显示事件
  const handleModalVisible = useCallback(() => {
    setShowFAQ(prev => !prev);
  }, []);

  const headerRight = useCallback(
    () => <Icon name="help-circle-outline" size={26} className="mr-4" onPress={handleModalVisible} />,
    [handleModalVisible],
  );

  const onRefresh = useCallback(() => {
    refetchTermList();
    refetchAcademicData();
  }, [refetchTermList, refetchAcademicData]);

  const renderTabFlatListContent = useCallback(
    (term: string) => {
      return (
        <TermContent
          termData={(academicData ?? []).filter(
            (it: JwchAcademicScoresResponse_AcademicScoresDataItem) => it.term === term,
          )}
          onRefresh={onRefresh}
          dataUpdatedAt={academicDataUpdatedAt}
        />
      );
    },
    [academicData, academicDataUpdatedAt, onRefresh],
  );

  const msvContent = useMemo(
    () => (
      <TabFlatList
        data={termList ?? []}
        value={currentTerm}
        onChange={setCurrentTerm}
        renderContent={renderTabFlatListContent}
      />
    ),
    [termList, currentTerm, renderTabFlatListContent],
  );

  return (
    <>
      <Tabs.Screen
        options={{
          title: '成绩查询',
          headerRight: headerRight,
        }}
      />

      <PageContainer>
        <MultiStateView state={state} content={msvContent} refresh={onRefresh} />

        {/* FAQ Modal */}
        <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} data={FAQ_COURSE_GRADE} />
      </PageContainer>
    </>
  );
}
