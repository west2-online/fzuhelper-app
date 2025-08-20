import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import ExamRoomCard from '@/components/academic/ExamRoomCard';
import FAQModal from '@/components/faq-modal';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';

import { getApiV1JwchClassroomExam, getApiV1JwchTermList } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import MultiStateView from '@/components/multistateview/multi-state-view';
import useApiRequest from '@/hooks/useApiRequest';
import useMultiStateRequest from '@/hooks/useMultiStateRequest';
import { FAQ_EXAM_ROOM } from '@/lib/FAQ';
import { formatExamData } from '@/lib/exam-room';
import { MergedExamData } from '@/types/academic';
import React from 'react';

interface TermContentProps {
  term: string;
}

const TermContent = React.memo<TermContentProps>(({ term }) => {
  const { width: screenWidth } = useWindowDimensions(); // 获取屏幕宽度
  const apiResult = useApiRequest(getApiV1JwchClassroomExam, { term });
  const { data, dataUpdatedAt, isFetching, refetch } = apiResult;

  const { state } = useMultiStateRequest(apiResult, {
    emptyCondition: responseData => !responseData || responseData.length === 0,
  });

  const termData = useMemo(
    () =>
      formatExamData(data || []).sort((a, b) => {
        const now = new Date(); // 当前日期
        // 排序优先级 最近的考试 > 稍近的考试 > 过期的考试 > 没有日期的考试

        // 如果只有一个有 date，优先排序有 date 的
        if (!a.date && b.date) return 1; // a 没有 date，b 有 date，b 优先
        if (a.date && !b.date) return -1; // a 有 date，b 没有 date，a 优先

        // 如果两个都没有 date，保持原顺序
        if (!a.date && !b.date) return 0;

        // 两者都有 date，确保 date 是有效的
        const dateA = new Date(a.date!); // 使用非空断言（!）告诉 TypeScript 这里一定有值
        const dateB = new Date(b.date!);

        // 如果一个未完成一个已完成，未完成优先
        if (a.isFinished && !b.isFinished) return 1; // a 已完成，b 未完成，b 优先
        if (!a.isFinished && b.isFinished) return -1; // a 未完成，b 已完成，a 优先

        // 计算与当前日期的时间差
        const diffA = Math.abs(dateA.getTime() - now.getTime());
        const diffB = Math.abs(dateB.getTime() - now.getTime());

        // 时间差小的优先
        return diffA - diffB;
      }),
    [data],
  );
  const lastUpdated = useMemo(() => new Date(dataUpdatedAt), [dataUpdatedAt]);
  const { bottom } = useSafeAreaInsets();
  const contentContainerStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);
  const flatListStyle = useMemo(() => ({ width: screenWidth }), [screenWidth]);

  const keyExtractor = useCallback((item: MergedExamData, index: number) => `${item.name}-${index}`, []);

  const renderItem = useCallback(({ item }: { item: MergedExamData }) => {
    return <ExamRoomCard item={item} />;
  }, []);

  const renderListFooterComponent = useMemo(() => {
    if (termData.length > 0) {
      return <LastUpdateTime lastUpdated={lastUpdated} />;
    }
    return null;
  }, [termData.length, lastUpdated]);

  return (
    <MultiStateView
      state={state}
      style={flatListStyle}
      content={
        <FlatList
          data={termData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          contentContainerStyle={contentContainerStyle}
          contentContainerClassName="mt-3 mx-4 gap-3"
          style={flatListStyle}
          ListFooterComponent={renderListFooterComponent}
        />
      }
      refresh={refetch}
    />
  );
});

TermContent.displayName = 'TermContent';

export default function ExamRoomPage() {
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期

  // 获取学期列表（当前用户）
  const apiResult = useApiRequest(getApiV1JwchTermList);
  const { data: termList, refetch } = apiResult;

  const { state } = useMultiStateRequest(apiResult, {
    emptyCondition: data => !data || data.length === 0,
    onContent: data => {
      // 只在首次加载（termList 存在且 currentTerm 为空）时设置 currentTerm
      if (!currentTerm) {
        setCurrentTerm(data[0]);
      }
    },
  });

  const [showFAQ, setShowFAQ] = useState(false); // 是否显示 FAQ

  // 处理 Modal 显示事件
  const handleModalVisible = useCallback(() => {
    setShowFAQ(prev => !prev);
  }, []);

  const headerRight = useCallback(
    () => <Icon name="help-circle-outline" size={26} className="mr-4" onPress={handleModalVisible} />,
    [handleModalVisible],
  );

  const renderContent = useCallback((term: string) => {
    return <TermContent term={term} />;
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: '考场查询',
          headerRight: headerRight,
        }}
      />

      <PageContainer>
        <MultiStateView
          state={state}
          className="flex-1"
          content={
            <TabFlatList
              data={termList ?? []}
              value={currentTerm}
              onChange={setCurrentTerm}
              renderContent={renderContent}
            />
          }
          refresh={refetch}
        />
      </PageContainer>

      {/* FAQ Modal */}
      <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} data={FAQ_EXAM_ROOM} />
    </>
  );
}
