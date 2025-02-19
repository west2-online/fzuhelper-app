import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { toast } from 'sonner-native';

import type { JwchAcademicCreditResponse_AcademicCreditData as CreditData } from '@/api/backend';
import { getApiV1JwchAcademicCredit } from '@/api/generate';
import { CreditCard } from '@/components/academic/CreditCard';
import Loading from '@/components/loading';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreditsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false); // 是否正在刷新
  const [creditData, setCreditData] = useState<CreditData[] | null>(null); // 学分数据
  const handleErrorRef = useRef(useSafeResponseSolve().handleError); // 错误处理函数

  // 获取学分数据
  const fetchCreditData = useCallback(async () => {
    try {
      const response = await getApiV1JwchAcademicCredit();
      setCreditData(response.data.data);
    } catch (error: any) {
      const data = handleErrorRef.current(error);
      if (data) toast.error(data.message || '发生未知错误，请稍后再试');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 初始化时获取学分数据
  useEffect(() => {
    setIsRefreshing(true);
    fetchCreditData();
  }, [fetchCreditData]);

  // 处理下拉刷新逻辑
  const handleRefresh = useCallback(() => {
    if (!isRefreshing) {
      setIsRefreshing(true); // 确保不会重复触发刷新
      setCreditData([]); // 清空数据
      fetchCreditData();
    }
  }, [setCreditData, fetchCreditData, isRefreshing]);

  return (
    <>
      <Stack.Screen options={{ headerTitle: '学分统计' }} />
      <SafeAreaView className="flex-1" edges={['bottom']}>
        <ScrollView
          className="flex-1 p-4"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        >
          {creditData && creditData.length > 0 ? (
            creditData.map((credit, index) => <CreditCard key={index} item={credit} />)
          ) : (
            <Loading />
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
