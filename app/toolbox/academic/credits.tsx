import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreditCard } from '@/components/academic/CreditCard';
import LastUpdateTime from '@/components/last-update-time';
import EmptyView from '@/components/multistateview/empty-view';
import MultiStateView from '@/components/multistateview/multi-state-view';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';

import { JwchAcademicCreditV2Response_Type } from '@/api/backend';
import { getApiV2JwchAcademicCredit } from '@/api/generate';
import useApiRequest from '@/hooks/useApiRequest';
import useMultiStateRequest from '@/hooks/useMultiStateRequest';

interface TabContentProps {
  group: JwchAcademicCreditV2Response_Type;
  dataUpdatedAt: number;
  onRefresh?: () => void;
}

const TabContent = React.memo<TabContentProps>(({ group, dataUpdatedAt, onRefresh }) => {
  const { width: screenWidth } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();

  return (
    <FlatList
      data={group.data}
      keyExtractor={(item, index) => `${item.key}-${index}`}
      renderItem={({ item }) => <CreditCard label={item.key} value={item.value} />}
      contentContainerClassName="mt-3 mx-4 gap-6"
      contentContainerStyle={{ paddingBottom: bottom }}
      initialNumToRender={20}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      ListEmptyComponent={<EmptyView className="-h-screen-safe-offset-12" />}
      ListFooterComponent={
        group.data && group.data.length > 0 ? <LastUpdateTime lastUpdated={new Date(dataUpdatedAt)} /> : null
      }
      style={{ width: screenWidth }}
    />
  );
});

TabContent.displayName = 'TabContent';

export default function CreditsPage() {
  const apiResult = useApiRequest(getApiV2JwchAcademicCredit);
  const { data: creditData, dataUpdatedAt, refetch } = apiResult;
  const { state } = useMultiStateRequest(apiResult, {
    emptyCondition: data => !data || data.length === 0,
  });

  const tabList = useMemo(() => (creditData ?? []).map(g => g.type), [creditData]);

  const [currentTab, setCurrentTab] = useState('主修专业');

  const renderContent = useCallback(
    (tab: string) => {
      const group = (creditData ?? []).find(g => g.type === tab);
      if (!group) return null;
      return <TabContent group={group} dataUpdatedAt={dataUpdatedAt} onRefresh={refetch} />;
    },
    [creditData, dataUpdatedAt, refetch],
  );

  const content = useMemo(() => {
    // 只有一个 Tab （主修专业）就不显示 Tab 栏
    if ((creditData ?? []).length === 1) {
      return <TabContent group={(creditData ?? [])[0]} dataUpdatedAt={dataUpdatedAt} onRefresh={refetch} />;
    }
    return <TabFlatList data={tabList} value={currentTab} onChange={setCurrentTab} renderContent={renderContent} />;
  }, [creditData, tabList, currentTab, renderContent, dataUpdatedAt, refetch]);

  return (
    <>
      <Stack.Screen options={{ headerTitle: '学分统计' }} />
      <PageContainer>
        <MultiStateView state={state} content={content} refresh={refetch} />
      </PageContainer>
    </>
  );
}
