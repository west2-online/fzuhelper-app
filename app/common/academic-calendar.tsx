import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';

import { TermsInfoResponse_Event } from '@/api/backend';
import { getApiV1JwchTermList, getApiV1TermsInfo } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import MultiStateView, { STATE } from '@/components/multistateview/multi-state-view';
import useApiRequest from '@/hooks/useApiRequest';
import React from 'react';
import { toast } from 'sonner-native';

interface CourseContentProps {
  term: string;
}

// 每个学期的内容
const AcademicContent = React.memo<CourseContentProps>(({ term }) => {
  const [state, setState] = useState(STATE.LOADING);
  const { width: screenWidth } = useWindowDimensions(); // 获取屏幕宽度
  // 获取学期数据
  const { data, dataUpdatedAt, isFetching, isError, error, refetch } = useApiRequest(getApiV1TermsInfo, { term });

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

  useEffect(() => {
    if (isFetching) {
      setState(STATE.LOADING);
    } else if (isError) {
      if (error && error.message) {
        toast.error(error.message);
      }
      setState(STATE.ERROR);
    } else if (!termData || termData.length === 0) {
      setState(STATE.EMPTY);
    } else {
      setState(STATE.CONTENT);
    }
  }, [isFetching, isError, error, termData]);

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
  const [state, setState] = useState(STATE.LOADING);
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期

  // 获取学期列表（当前用户）
  const { data: termList, isFetching, isError, error, refetch } = useApiRequest(getApiV1JwchTermList);

  useEffect(() => {
    if (isFetching) {
      setState(STATE.LOADING);
    } else if (isError) {
      if (error && error.message) {
        toast.error(error.message);
      }
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
  }, [termList, isFetching, isError, error, currentTerm]);

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
