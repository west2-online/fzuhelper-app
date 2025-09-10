import { fetchNoticeList } from '@/api/generate/common';
import FAQModal from '@/components/faq-modal';
import { Icon } from '@/components/Icon';
import Loading from '@/components/loading';
import MultiStateView, { STATE } from '@/components/multistateview/multi-state-view';
import PageContainer from '@/components/page-container';
import { Card } from '@/components/ui/card';
import useApiRequest from '@/hooks/useApiRequest';
import { FAQ_NOTICE } from '@/lib/FAQ';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

interface NoticeItem {
  title: string;
  url: string;
  date: string;
}

export default function OfficeNoticePage() {
  const [pageNum, setPageNum] = useState(1);
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [state, setState] = useState(STATE.LOADING);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEnd, setIsEnd] = useState(false);
  const { bottom } = useSafeAreaInsets();

  const { data, isFetching, isError, error, refetch } = useApiRequest(fetchNoticeList, { pageNum });

  useEffect(() => {
    if (data) {
      const newNotices = data.notices || [];
      if (pageNum === 1) {
        setNoticeList(newNotices);
      } else {
        setNoticeList(prev => [...prev, ...newNotices]);
      }
      if (newNotices.length < 20) {
        setIsEnd(true);
      } else {
        setIsEnd(false);
      }
      setIsLoadingMore(false);
    }
  }, [data, pageNum]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPageNum(1);
    refetch().finally(() => {
      setRefreshing(false);
    });
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || isEnd || isFetching) return;
    setIsLoadingMore(true);
    const nextPage = pageNum + 1;
    setPageNum(nextPage);
  }, [isLoadingMore, isEnd, isFetching, pageNum]);

  // 这里的状态管理涉及到分页，较为复杂，暂不使用 useMultiStateRequest
  useEffect(() => {
    if (isFetching && !isLoadingMore && pageNum === 1) {
      setState(STATE.LOADING);
    } else if (isError) {
      if (error?.data?.message) {
        toast.error(error.data.message);
      }
      setIsLoadingMore(false);
      if (pageNum === 1) {
        setState(STATE.ERROR);
      }
    } else if (noticeList.length === 0) {
      setState(STATE.EMPTY);
    } else {
      setState(STATE.CONTENT);
    }
  }, [error, isError, isFetching, isLoadingMore, noticeList.length, pageNum]);

  const handleNoticePress = useCallback(async (url: string) => {
    // 不使用 webview 是因为教务通知中往往会下载文件，webview 不太好保存什么的
    await Linking.openURL(url);
  }, []);

  const renderNoticeItem = useCallback(
    ({ item }: { item: NoticeItem }) => (
      <TouchableOpacity activeOpacity={0.7} onPress={() => handleNoticePress(item.url)} className="mb-4">
        <Card className="gap-2 p-4">
          <Text className="text-lg font-medium text-text-primary">{item.title}</Text>
          <Text className="text-sm text-text-secondary">{item.date}</Text>
        </Card>
      </TouchableOpacity>
    ),
    [handleNoticePress],
  );

  const [showFAQ, setShowFAQ] = useState(false); // 是否显示 FAQ

  // 处理 Modal 显示事件
  const handleModalVisible = useCallback(() => {
    setShowFAQ(prev => !prev);
  }, []);

  const headerRight = useCallback(
    () => <Icon name="help-circle-outline" size={26} className="mr-4" onPress={handleModalVisible} />,
    [handleModalVisible],
  );

  const msvContent = useMemo(() => {
    return (
      <FlatList
        data={noticeList}
        renderItem={renderNoticeItem}
        keyExtractor={item => `${item.url}`}
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          isLoadingMore ? (
            <Loading />
          ) : isEnd && noticeList.length > 0 ? (
            <Text className="my-2 mb-4 text-center text-text-secondary">没有更多了</Text>
          ) : null
        }
      />
    );
  }, [noticeList, renderNoticeItem, bottom, refreshing, handleRefresh, handleLoadMore, isLoadingMore, isEnd]);

  return (
    <>
      <Stack.Screen options={{ title: '教务通知', headerRight: headerRight }} />
      <PageContainer>
        <MultiStateView state={state} className="flex-1" content={msvContent} refresh={refetch} />
      </PageContainer>
      <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} data={FAQ_NOTICE} />
    </>
  );
}
