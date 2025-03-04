import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import type { JwchAcademicGpaResponse } from '@/api/backend';
import { getApiV1JwchAcademicGpa } from '@/api/generate';
import { Icon } from '@/components/Icon';
import Loading from '@/components/loading';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { SafeAreaView } from 'react-native-safe-area-context';

const NAVIGATION_TITLE = '绩点排名';

export default function GPAPage() {
  const [isRefreshing, setIsRefreshing] = useState(true); // 按钮是否禁用
  const [academicData, setAcademicData] = useState<JwchAcademicGpaResponse | null>(null); // 学术成绩数据

  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理

  // 设置导航栏标题
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  // 访问 west2-online 服务器
  const getAcademicData = useCallback(async () => {
    try {
      const result = await getApiV1JwchAcademicGpa();
      setAcademicData(result.data.data); // 第一个 data 指的是响应 HTTP 的 data 字段，第二个 data 指的是响应数据的 data 字段
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        toast.error(data.msg ? data.msg : '未知错误');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [handleError]);

  useEffect(() => {
    getAcademicData();
  }, [getAcademicData]);

  const handleRefresh = useCallback(() => {
    if (!isRefreshing) {
      setIsRefreshing(true);
      setAcademicData(null);
      getAcademicData();
    }
  }, [getAcademicData, isRefreshing]);

  return (
    <PageContainer className="bg-background">
      {isRefreshing ? (
        <Loading />
      ) : (
        <ScrollView
          className="flex-1 p-4"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
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
                {/* 显示最后更新时间 */}
                <View className="my-3 flex flex-row items-center justify-center rounded-lg p-2">
                  <Icon name="time-outline" size={16} className="mr-2" />
                  <Text className="text-l leading-5 text-text-primary">{academicData.time}</Text>
                </View>
                <Text className="p-2 text-red-500">
                  注：绩点排名中的总学分只计算参与绩点计算的学分总和，并不代表所修学分总和。
                </Text>
              </SafeAreaView>
            </View>
          )}
        </ScrollView>
      )}
    </PageContainer>
  );
}
