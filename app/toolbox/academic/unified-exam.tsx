import { Icon } from '@/components/Icon';
import { Stack } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { UnifiedExamCard } from '@/components/academic/UnifiedExamCard';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { getApiV1JwchAcademicUnifiedExam } from '@/api/generate';
import useApiRequest from '@/hooks/useApiRequest';

const errorHandler = (data: any) => {
  if (data) toast.error(data.msg || '发生未知错误，请稍后再试');
};

export default function UnifiedExamScorePage() {
  // 获取统考成绩数据
  const {
    data: unifiedExamData,
    dataUpdatedAt,
    isLoading,
    refetch,
  } = useApiRequest(getApiV1JwchAcademicUnifiedExam, {}, { errorHandler });
  const lastUpdated = new Date(dataUpdatedAt);

  return (
    <>
      <Stack.Screen options={{ title: '统考成绩' }} />
      <PageContainer>
        {isLoading ? (
          <Loading />
        ) : (
          <SafeAreaView className="flex-1" edges={['bottom']}>
            <ScrollView
              className="p-4"
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  // 下拉刷新逻辑
                  onRefresh={refetch}
                />
              }
            >
              {unifiedExamData && unifiedExamData.length > 0 && (
                <>
                  <SafeAreaView className="flex-1" edges={['bottom']}>
                    {unifiedExamData.map((item, index) => (
                      <UnifiedExamCard key={index} item={item} />
                    ))}
                    {/* 显示最后更新时间 */}
                    {lastUpdated && (
                      <View className="my-3 flex flex-row items-center justify-center rounded-lg p-2">
                        <Icon name="time-outline" size={16} className="mr-2" />
                        <Text className="text-l leading-5 text-text-primary">
                          数据同步时间：{lastUpdated.toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </SafeAreaView>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </PageContainer>
    </>
  );
}
