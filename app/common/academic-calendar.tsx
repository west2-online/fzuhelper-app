import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';

import { TermsInfoResponse_Event } from '@/api/backend';
import { getApiV1JwchTermList, getApiV1TermsInfo } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import MultiStateView from '@/components/multistateview/multi-state-view';
import useApiRequest from '@/hooks/useApiRequest';
import useMultiStateRequest from '@/hooks/useMultiStateRequest';
import React from 'react';

interface CourseContentProps {
  term: string;
}

// 每个学期的内容
const AcademicContent = React.memo<CourseContentProps>(({ term }) => {
  const { width: screenWidth } = useWindowDimensions(); // 获取屏幕宽度
  // 获取学期数据
  const apiResult = useApiRequest(getApiV1TermsInfo, { term });
  const { data, dataUpdatedAt, isFetching, refetch } = apiResult;

  const { state } = useMultiStateRequest(apiResult, {
    emptyCondition: _data => !_data?.events || _data.events.length === 0,
  });

  const termData = useMemo(() => data?.events || [], [data]);
  const lastUpdated = useMemo(() => new Date(dataUpdatedAt), [dataUpdatedAt]);
  const { bottom } = useSafeAreaInsets();

  const keyExtractor = useCallback((item: any, index: number) => `${item.name}-${index}`, []);

  const renderItem = useCallback(({ item }: { item: TermsInfoResponse_Event }) => {
    return <LabelEntry leftText={item.name} description={`${item.start_date} - ${item.end_date}`} disabled noIcon />;
  }, []);

  const contentContainerStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);

  const renderListFooterComponent = useMemo(() => {
    return <LastUpdateTime lastUpdated={lastUpdated} />;
  }, [lastUpdated]);

  const flatListStyle = useMemo(() => ({ width: screenWidth }), [screenWidth]);

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
          ListFooterComponent={renderListFooterComponent}
          style={flatListStyle}
          contentContainerClassName="mt-3 mx-8"
        />
      }
      refresh={refetch}
    />
  );
});

AcademicContent.displayName = 'AcademicContent';

export default function AcademicCalendarPage() {
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

  return (
    <>
      <Stack.Screen options={{ title: '校历' }} />

      <PageContainer>
        <MultiStateView
          state={state}
          className="flex-1"
          content={
            <TabFlatList
              data={termList ?? []}
              value={currentTerm}
              onChange={setCurrentTerm}
              renderContent={term => <AcademicContent term={term} />}
            />
          }
          refresh={refetch}
        />
      </PageContainer>
    </>
  );
}
