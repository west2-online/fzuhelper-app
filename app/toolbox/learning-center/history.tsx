import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { toast } from 'sonner-native';

import HistoryAppointmentCard, { AppointmentCardProps } from '@/components/learning-center/history-appointment-card';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';
import ApiService from '@/utils/learning-center/api_service';

import { TOKEN_STORAGE_KEY } from './token';

const NAVIGATION_TITLE = '预约历史';
const PAGE_SIZE = 10;

export default function HistoryPage() {
  const navigation = useNavigation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentCardProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasToken, setHasToken] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  useEffect(() => {
    const checkTokenAndFetchData = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (savedToken) {
          await AsyncStorage.setItem('token', savedToken);
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
        } else {
          toast.error('请先设置学习中心令牌');
          router.push('/toolbox/learning-center/token');
          return;
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

  const handleLoadMore = () => {
    if (isLoadingMore || currentPage >= totalPages) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    fetchAppointments(nextPage, true).finally(() => {
      setIsLoadingMore(false);
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setCurrentPage(1);

    fetchAppointments(1).finally(() => {
      setIsRefreshing(false);
    });
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
    const key = `${item.id}_${item.date}_${item.beginTime.replace(':', '_')}_${item.endTime.replace(':', '_')}`;
    return key;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <PageContainer className="flex-1 bg-background">
      <FlatList
        data={appointments}
        renderItem={({ item }) => <HistoryAppointmentCard {...item} />}
        keyExtractor={generateUniqueKey}
        contentContainerClassName="px-4 py-4"
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-lg font-bold">预约历史</Text>
          </View>
        }
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
  );
}
