import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import { getApiV1JwchAcademicGpa } from '@/api/generate';
import LastUpdateTime from '@/components/last-update-time';
import MultiStateView, { STATE } from '@/components/multistateview/multi-state-view';
import useApiRequest from '@/hooks/useApiRequest';

export default function GPAPage() {
  const [state, setState] = useState(STATE.LOADING);
  const { data: academicData, isFetching, isError, error, refetch } = useApiRequest(getApiV1JwchAcademicGpa);

  useEffect(() => {
    if (isFetching) {
      setState(STATE.LOADING);
    } else if (isError) {
      if (error && error.message) {
        toast.error(error.message);
      }
      setState(STATE.ERROR);
    } else if (!academicData || !academicData.data || academicData.data.length === 0) {
      setState(STATE.EMPTY);
    } else {
      setState(STATE.CONTENT);
    }
  }, [isFetching, isError, error, academicData]);

  return (
    <>
      <Stack.Screen options={{ title: '绩点排名' }} />
      <PageContainer>
        <MultiStateView
          state={state}
          className="flex-1"
          content={
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 pt-4"
              refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
            >
              <View>
                {/* 数据列表 */}
                <SafeAreaView edges={['bottom']}>
                  {academicData?.data.map((item, index) => (
                    <View className="my-1 flex-row justify-between p-2" key={item.type}>
                      <Text>{item.type}</Text>
                      <Text className="font-bold">{item.value}</Text>
                    </View>
                  ))}
                  {/* 显示最后更新时间，与其他不同，这个是教务处网页上有的，因此非本地网络请求的时间 */}
                  <LastUpdateTime text="" lastUpdatedText={academicData?.time} />
                  <Text className="p-2 text-red-500">
                    注：绩点排名中的总学分只计算参与绩点计算的学分总和，并不代表所修学分总和。
                  </Text>
                </SafeAreaView>
              </View>
            </ScrollView>
          }
          refresh={refetch}
        />
      </PageContainer>
    </>
  );
}
