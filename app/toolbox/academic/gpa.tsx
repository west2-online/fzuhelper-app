import { Stack } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { getApiV1JwchAcademicGpa } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import Loading from '@/components/loading';
import useApiRequest from '@/hooks/useApiRequest';
import { SafeAreaView } from 'react-native-safe-area-context';

const errorHandler = (data: any) => {
  if (data) toast.error(data.msg || '发生未知错误，请稍后再试');
};

export default function GPAPage() {
  const { data: academicData, isLoading, refetch } = useApiRequest(getApiV1JwchAcademicGpa, {}, { errorHandler });

  return (
    <>
      <Stack.Screen options={{ title: '绩点排名' }} />
      <PageContainer>
        {isLoading ? (
          <Loading />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pt-4"
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          >
            {/* 学术成绩数据列表 */}
            {academicData && (
              <View>
                {/* 数据列表 */}
                <SafeAreaView edges={['bottom']}>
                  {academicData.data.map((item, index) => (
                    <View className="my-1 flex-row justify-between p-2" key={item.type}>
                      <Text>{item.type}</Text>
                      <Text className="font-bold">{item.value}</Text>
                    </View>
                  ))}
                  {/* 显示最后更新时间，与其他不同，这个是教务处网页上有的，因此非本地网络请求的时间 */}
                  <LastUpdateTime text="" lastUpdatedText={academicData.time} />
                  <Text className="p-2 text-red-500">
                    注：绩点排名中的总学分只计算参与绩点计算的学分总和，并不代表所修学分总和。
                  </Text>
                </SafeAreaView>
              </View>
            )}
          </ScrollView>
        )}
      </PageContainer>
    </>
  );
}
