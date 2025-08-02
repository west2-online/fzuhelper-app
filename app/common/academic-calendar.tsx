import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';
import { Text } from '@/components/ui/text';

import { TermsInfoResponse_Event } from '@/api/backend';
import { ResultEnum } from '@/api/enum';
import { getApiV1JwchTermList, getApiV1TermsInfo } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import Loading from '@/components/loading';
import useApiRequest from '@/hooks/useApiRequest';
import React from 'react';

// 处理API错误
const handleApiError = (errorData: any) => {
  if (errorData) {
    if (errorData.code === ResultEnum.BizErrorCode) {
      return;
    }
    toast.error(errorData.message || '发生未知错误，请稍后再试');
  }
};

interface CourseContentProps {
  term: string;
}

// 每个学期的内容
const AcademicContent = React.memo<CourseContentProps>(({ term }) => {
  const { width: screenWidth } = useWindowDimensions(); // 获取屏幕宽度
  // 获取学期数据
  const { data, dataUpdatedAt, isLoading, refetch } = useApiRequest(
    getApiV1TermsInfo,
    { term },
    { errorHandler: handleApiError },
  );

  const termData = useMemo(() => data?.events || [], [data]);
  const lastUpdated = useMemo(() => new Date(dataUpdatedAt), [dataUpdatedAt]);
  const { bottom } = useSafeAreaInsets();

  const keyExtractor = useCallback((item: any, index: number) => `${item.name}-${index}`, []);

  const renderItem = useCallback(({ item }: { item: TermsInfoResponse_Event }) => {
    return <LabelEntry leftText={item.name} description={`${item.start_date} - ${item.end_date}`} disabled noIcon />;
  }, []);

  const contentContainerStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);

  const renderListEmptyComponent = useMemo(() => {
    if (isLoading) {
      return null;
    }
    return <Text className="text-center text-text-secondary">暂无学期数据</Text>;
  }, [isLoading]);

  const renderListFooterComponent = useMemo(() => {
    return <LastUpdateTime lastUpdated={lastUpdated} />;
  }, [lastUpdated]);

  const flatListStyle = useMemo(() => ({ width: screenWidth }), [screenWidth]);

  return (
    <FlatList
      data={termData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      contentContainerStyle={contentContainerStyle}
      ListEmptyComponent={renderListEmptyComponent}
      ListFooterComponent={renderListFooterComponent}
      style={flatListStyle}
      contentContainerClassName="mt-3 mx-8"
    />
  );
});

AcademicContent.displayName = 'AcademicContent';

export default function AcademicCalendarPage() {
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期
  // 获取学期列表（当前用户）
  const onSuccess = useCallback(
    (terms: string[]) => {
      if (!currentTerm && terms.length) {
        setCurrentTerm(terms[0]);
      }
    },
    [currentTerm],
  );
  const { data: termList, isLoading: isLoadingTermList } = useApiRequest(
    getApiV1JwchTermList,
    {},
    { onSuccess, errorHandler: handleApiError },
  );

  return (
    <>
      <Stack.Screen options={{ title: '校历' }} />

      <PageContainer>
        {isLoadingTermList ? (
          <Loading />
        ) : (
          <TabFlatList
            data={termList ?? []}
            value={currentTerm}
            onChange={setCurrentTerm}
            renderContent={term => <AcademicContent term={term} />}
          />
        )}
      </PageContainer>
    </>
  );
}
