import { Stack } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { DescriptionList } from '@/components/DescriptionList';
import { Icon } from '@/components/Icon';
import { CreditCard } from '@/components/academic/CreditCard';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { getApiV1JwchAcademicCredit } from '@/api/generate';
import useApiRequest from '@/hooks/useApiRequest';

const errorHandler = (data: any) => {
  if (data) toast.error(data.msg || '发生未知错误，请稍后再试');
};

export default function CreditsPage() {
  const {
    data: creditData,
    dataUpdatedAt,
    isLoading,
    refetch,
  } = useApiRequest(getApiV1JwchAcademicCredit, {}, { errorHandler });
  const lastUpdated = new Date(dataUpdatedAt); // 数据最后更新时间

  return (
    <>
      <Stack.Screen options={{ headerTitle: '学分统计' }} />
      {isLoading ? (
        <Loading />
      ) : (
        <PageContainer className="bg-background">
          <ScrollView
            className="flex-1 p-4"
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          >
            {creditData && creditData.length > 0 && (
              <>
                <SafeAreaView className="flex-1" edges={['bottom']}>
                  <DescriptionList className="gap-6">
                    {creditData.map((credit, index) => (
                      <CreditCard key={index} type={credit.type} gain={credit.gain} total={credit.total} />
                    ))}
                  </DescriptionList>

                  {/* 显示最后更新时间 */}
                  {lastUpdated && (
                    <View className="my-4 flex flex-row items-center justify-center rounded-lg p-2">
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
        </PageContainer>
      )}
    </>
  );
}
