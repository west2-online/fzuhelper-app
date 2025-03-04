import HistoryAppointmentCard from '@/components/learning-center/history-appointment-card';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import ApiService, { SeatModel } from '@/utils/learning-center/api_service';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { toast } from 'sonner-native';
const PAGE_SIZE = 10;

export default function HistoryPage() {
  const { token } = useLocalSearchParams<{ token: string }>(); // TODO 从路由参数中获取token，之后的api的请求由parm传递token
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SeatModel[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const api = useMemo(() => new ApiService(), []);

  const fetchData = useCallback(async () => {
    try {
      const appointmentData = await api.fetchAppointments({
        currentPage: page,
        pageSize: PAGE_SIZE,
        auditStatus: '',
      });
      setData(prevData => (page === 1 ? appointmentData : [...prevData, ...appointmentData]));
      console.log('增加了第' + page + '页');
    } catch (error: any) {
      toast.error(`加载数据失败，请稍后重试${error.message}`);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [page, api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <Stack.Screen name="HistoryPage" options={{ title: '预约记录' }} />
      {/*  判断首次进入刷新 */}
      {isLoading ? (
        <Loading />
      ) : (
        <PageContainer className="p-2">
          <FlatList
            data={data}
            renderItem={({ item }) => (
              <HistoryAppointmentCard
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
                onRefresh={fetchData}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  setPage(1);
                  fetchData();
                }}
              />
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
          />
        </PageContainer>
      )}
    </>
  );
}
