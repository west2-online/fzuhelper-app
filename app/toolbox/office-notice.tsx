import { fetchNoticeList } from '@/api/generate/common';
import PageContainer from '@/components/page-container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import useApiRequest from '@/hooks/useApiRequest';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, RefreshControl, Text, TouchableOpacity } from 'react-native';

interface NoticeItem {
  title: string;
  url: string;
  date: string;
}

export default function OfficeNoticePage() {
  const [pageNum, setPageNum] = useState(1);
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEnd, setIsEnd] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useApiRequest(
    fetchNoticeList,
    { pageNum },
    {
      errorHandler: error => {
        console.error('教务处通知加载错误：', error);
        setIsLoadingMore(false);
        return error;
      },
    },
  );

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
    if (isLoadingMore || isEnd || isLoading || isRefetching) return;
    setIsLoadingMore(true);
    const nextPage = pageNum + 1;
    setPageNum(nextPage);
  }, [isLoadingMore, isEnd, isLoading, isRefetching, pageNum]);

  const handleNoticePress = useCallback(async (url: string) => {
    // 不使用 webview 是因为教务通知中往往会下载文件，webview 不太好保存什么的
    await Linking.openURL(url);
  }, []);

  const renderNoticeItem = useCallback(
    ({ item }: { item: NoticeItem }) => (
      <TouchableOpacity onPress={() => handleNoticePress(item.url)} className="mb-4">
        <Card>
          <CardHeader>
            <Text className="text-lg font-medium text-card-foreground">{item.title}</Text>
          </CardHeader>
          <CardContent>
            <Text className="text-sm text-text-secondary">{item.date}</Text>
          </CardContent>
        </Card>
      </TouchableOpacity>
    ),
    [handleNoticePress],
  );

  if ((isLoading || isRefetching) && !isLoadingMore && pageNum === 1) {
    return (
      <>
        <Stack.Screen options={{ title: '教务处通知' }} />
        <PageContainer className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '教务处通知' }} />
      <PageContainer>
        <FlatList
          data={noticeList}
          renderItem={renderNoticeItem}
          keyExtractor={item => `${item.url}`}
          className="flex-1 px-4 pt-4"
          ListEmptyComponent={<Text>暂无通知</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" className="py-8" />
            ) : isEnd && noticeList.length > 0 ? (
              <Text className="my-2 text-center text-text-secondary">没有更多了</Text>
            ) : null
          }
        />
      </PageContainer>
    </>
  );
}
