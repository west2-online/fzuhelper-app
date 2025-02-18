import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import type { JwchAcademicCreditResponse_AcademicCreditData as CreditData } from '@/api/backend';
import { getApiV1JwchAcademicCredit } from '@/api/generate';
import { Text } from '@/components/ui/text';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// 不展示'学分'二字的学分类型
const NOT_SHOW_CREDIT_TYPE: string[] = ['CET-4', 'CET-6'] as const;

// 生成学分卡片
interface CreditCardProps {
  item: CreditData;
}
const CreditCard: React.FC<CreditCardProps> = ({ item }) => (
  <View className="mb-1 mt-1 flex-row justify-between p-2" key={item.type}>
    <Text>{item.type}</Text>
    <Text className="font-bold">
      {item.gain === '' ? '0' : item.gain}
      {item.total.trim() === '' ? '' : '/' + item.total}
      {NOT_SHOW_CREDIT_TYPE.includes(item.type) ? '' : '学分'}
    </Text>
  </View>
);

export default function CreditsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false); // 是否正在刷新
  const [creditData, setCreditData] = useState<CreditData[] | null>(null); // 学分数据
  const handleErrorRef = useRef(useSafeResponseSolve().handleError); // 错误处理函数

  // 获取学分数据
  const fetchCreditData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const response = await getApiV1JwchAcademicCredit();
      setCreditData(response.data.data);
      console.log('fetchCreditData', response.data.data);
    } catch (error: any) {
      const data = handleErrorRef.current(error);
      if (data) toast.error(data.message || '发生未知错误，请稍后再试');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 初始化时获取学分数据
  useEffect(() => {
    fetchCreditData();
  }, [fetchCreditData]);

  return (
    <>
      <Stack.Screen options={{ headerTitle: '学分统计' }} />
      <SafeAreaView className="flex-1" edges={['bottom']}>
        <ScrollView
          className="flex-1 p-4"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={fetchCreditData} />}
        >
          {creditData?.map((credit, index) => <CreditCard key={index} item={credit} />)}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
