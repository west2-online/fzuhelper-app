import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import HistoryAppointmentCard from '@/components/learning-center/history-appointment-card';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { useLearningCenterApi } from '@/context/learning-center';
import { compareAppointments, fetchAppointmentsData } from '@/utils/learning-center/api-service';

const PAGE_SIZE = 30; // 每次请求返回的数据量

export default function HistoryPage() {
  const [page, setPage] = useState(1); // 当前页数
  const [data, setData] = useState<fetchAppointmentsData[]>([]); // 预约记录数据
  const [isRefreshing, setIsRefreshing] = useState(true); // 控制刷新状态
  const [isBottom, setIsBottom] = useState(false); // 判断是否请求了所有的数据
  const insets = useSafeAreaInsets();
  const api = useLearningCenterApi();

  // 请求数据
  const fetchData = useCallback(
    async (ignoreBottomCheck = false) => {
      try {
        // 如果已经请求了所有的数据，就不再请求
        if (isBottom && !ignoreBottomCheck) {
          return;
        }

        // 请求数据
        const appointmentData = await api.fetchAppointments({
          currentPage: page,
          pageSize: PAGE_SIZE,
          auditStatus: '',
        });

        // 判断是否请求到了所有的数据
        if (appointmentData.length < PAGE_SIZE || appointmentData.length === 0) {
          setIsBottom(true);
        }

        // 更新数据
        setData(prevData => (page === 1 ? appointmentData : [...prevData, ...appointmentData]));
        console.log('拉取了第' + page + '页');
      } catch (error: any) {
        toast.error(`加载数据失败: ${error.message}`);
      } finally {
        setIsRefreshing(false);
      }
    },
    [page, api, isBottom],
  );

  // 刷新数据
  const refresh = useCallback(async () => {
    setPage(1); // 重置页数
    setIsRefreshing(true); // 开启刷新
    setIsBottom(false); // 重置是否到底
    await fetchData(true); // 重新请求数据
  }, [fetchData]);

  // 首次加载数据
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: '我的预约' }} />
      <PageContainer className="px-2">
        {isRefreshing ? (
          <Loading />
        ) : (
          <FlatList
            data={[...data].sort(compareAppointments)}
            renderItem={({ item }) => (
              <HistoryAppointmentCard
                key={item.id}
                id={item.id}
                spaceName={item.spaceName}
                floor={item.floor}
                date={item.date}
                beginTime={item.beginTime}
                endTime={item.endTime}
                regionName={item.regionName}
                seatCode={item.seatCode}
                auditStatus={item.auditStatus}
                sign={item.sign}
                onRefresh={refresh}
              />
            )}
            refreshControl={
              // 下拉刷新
              <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
            }
            onEndReachedThreshold={0.1}
            onEndReached={() => {
              setPage(prevPage => prevPage + 1);
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center">
                <Text>暂无预约记录</Text>
              </View>
            }
            ListFooterComponent={
              <View className="mb-2 flex-1 items-center justify-center">
                <Text>{isBottom ? '已经到底了' : ''}</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: insets.bottom }}
          />
        )}
      </PageContainer>
    </>
  );
}
