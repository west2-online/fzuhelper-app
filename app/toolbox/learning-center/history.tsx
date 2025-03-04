import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { toast } from 'sonner-native';

import HistoryAppointmentCard, { AppointmentCardProps } from '@/components/learning-center/history-appointment-card';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { LEARNING_CENTER_TOKEN_KEY } from '@/lib/constants';
import ApiService from '@/utils/learning-center/api_service';

const PAGE_SIZE = 10;

const REFRESH_FLAG_KEY = 'learning_center_refresh_needed';

export default function HistoryPage() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams<{ refresh: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentCardProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasToken, setHasToken] = useState(false);

  const fetchAppointments = useCallback(
    async (page: number, shouldAppend = false) => {
      if (!hasToken) return;

      try {
        const response = await ApiService.fetchAppointments({
          currentPage: page,
          pageSize: PAGE_SIZE,
          auditStatus: '',
        });

        if (response.code === '0') {
          const totalItems = response.total;
          const calculatedTotalPages = Math.ceil(totalItems / PAGE_SIZE);
          setTotalPages(calculatedTotalPages);

          if (shouldAppend) {
            const newItems = response.dataList.filter(
              (newItem: AppointmentCardProps) =>
                !appointments.some(
                  existingItem =>
                    existingItem.id === newItem.id &&
                    existingItem.date === newItem.date &&
                    existingItem.beginTime === newItem.beginTime,
                ),
            );
            setAppointments(prev => [...prev, ...newItems]);
          } else {
            setAppointments(response.dataList);
          }
        } else {
          toast.error(`获取预约历史失败: ${response.msg}`);
        }
      } catch (error: any) {
        console.error(error);
        toast.error(`获取预约历史时出错: ${error.message}`);
      }
    },
    [hasToken, appointments],
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setCurrentPage(1);
    fetchAppointments(1).finally(() => setIsRefreshing(false));
  }, [fetchAppointments]);

  useEffect(() => {
    const checkTokenAndFetchData = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(LEARNING_CENTER_TOKEN_KEY);
        if (savedToken) {
          await AsyncStorage.setItem(LEARNING_CENTER_TOKEN_KEY, savedToken);
          setHasToken(true);
          try {
            const response = await ApiService.fetchAppointments({
              currentPage: 1,
              pageSize: PAGE_SIZE,
              auditStatus: '',
            });

            if (response.code === '0') {
              const totalItems = response.total;
              const calculatedTotalPages = Math.ceil(totalItems / PAGE_SIZE);
              setTotalPages(calculatedTotalPages);
              setAppointments(response.dataList);
            } else {
              toast.error(`获取预约历史失败: ${response.msg}`);
            }
          } catch (error: any) {
            console.error(error);
            toast.error(`获取预约历史时出错: ${error.message}`);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error('检查令牌时出错');
      } finally {
        setIsLoading(false);
      }
    };
    checkTokenAndFetchData();
  }, [router]);

  useEffect(() => {
    if (refresh === 'true' && hasToken && !isLoading) {
      handleRefresh();
    }
  }, [refresh, hasToken, isLoading, handleRefresh]);

  useFocusEffect(
    useCallback(() => {
      const checkRefreshFlag = async () => {
        try {
          const refreshNeeded = await AsyncStorage.getItem(REFRESH_FLAG_KEY);
          if (refreshNeeded === 'true' && hasToken) {
            await AsyncStorage.removeItem(REFRESH_FLAG_KEY);
            handleRefresh();
          }
        } catch (error) {
          console.error(error);
        }
      };
      checkRefreshFlag();
    }, [hasToken, handleRefresh]),
  );

  const handleLoadMore = () => {
    if (isLoadingMore || currentPage >= totalPages) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    fetchAppointments(nextPage, true).finally(() => setIsLoadingMore(false));
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View className="flex items-center justify-center py-4">
        <ActivityIndicator size="small" color="#1f1f1f" />
        <Text className="mt-2 text-sm text-text-secondary">正在加载更多...</Text>
      </View>
    );
  };

  const generateUniqueKey = (item: AppointmentCardProps) => {
    return `${item.id}_${item.date}_${item.beginTime.replace(':', '_')}_${item.endTime.replace(':', '_')}`;
  };

  return (
    <>
      <Stack.Screen options={{ title: '预约历史', headerShown: true }} />
      {isLoading ? (
        <Loading />
      ) : (
        <PageContainer className="flex-1 bg-background">
          <FlatList
            data={appointments}
            renderItem={({ item }) => <HistoryAppointmentCard {...item} onRefresh={handleRefresh} />}
            keyExtractor={generateUniqueKey}
            contentContainerClassName="px-4 py-4"
            ListEmptyComponent={
              <View className="flex items-center justify-center py-8">
                <Text className="text-base text-text-secondary">暂无预约记录</Text>
              </View>
            }
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          />
        </PageContainer>
      )}
    </>
  );
}
