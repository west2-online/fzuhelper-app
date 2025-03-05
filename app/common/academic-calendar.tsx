import { Stack } from 'expo-router';
import { useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Icon } from '@/components/Icon';
import LabelEntry from '@/components/label-entry';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';
import { Text } from '@/components/ui/text';

import { ResultEnum } from '@/api/enum';
import { getApiV1JwchTermList, getApiV1TermsInfo } from '@/api/generate';
import useApiRequest from '@/hooks/useApiRequest';

// 处理API错误
const handleApiError = (errorData: any) => {
  if (errorData) {
    if (errorData.code === ResultEnum.BizErrorCode) {
      return;
    }
    toast.error(errorData.message || '发生未知错误，请稍后再试');
  }
};

interface CourseContentProps {
  term: string;
}

// 每个学期的内容
const CourseContent: React.FC<CourseContentProps> = ({ term }) => {
  const screenWidth = Dimensions.get('window').width; // 获取屏幕宽度
  // 获取学期数据
  const { data, dataUpdatedAt, isLoading, refetch } = useApiRequest(
    getApiV1TermsInfo,
    { term },
    { errorHandler: handleApiError },
  );

  const termData = data?.events || [];
  const lastUpdated = new Date(dataUpdatedAt);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          // 处理下拉刷新逻辑
          onRefresh={refetch}
        />
      }
      className="grow"
      style={{ width: screenWidth }}
    >
      {/* 渲染考试数据 */}
      <SafeAreaView edges={['bottom']}>
        {termData.length > 0 ? (
          termData.map((item, idx) => (
            <View key={idx} className="mx-4">
              <LabelEntry leftText={item.name} description={item.start_date + ' - ' + item.end_date} disabled noIcon />
            </View>
          ))
        ) : (
          <Text className="text-center text-text-secondary">{isLoading ? '正在刷新中' : '暂无学期数据'}</Text>
        )}
      </SafeAreaView>

      {/* 显示刷新时间 */}
      {lastUpdated && (
        <View className="my-4 flex flex-row items-center justify-center">
          <Icon name="time-outline" size={16} className="mr-2" />
          <Text className="text-sm leading-5 text-text-primary">数据同步时间：{lastUpdated.toLocaleString()}</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default function AcademicCalendarPage() {
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期
  // 获取学期列表（当前用户）
  const { data: termList } = useApiRequest(getApiV1JwchTermList, {}, { errorHandler: handleApiError });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitleAlign: 'center',
          headerTitle: '学期校历',
        }}
      />

      <PageContainer>
        <TabFlatList
          data={termList ?? []}
          value={currentTerm}
          onChange={setCurrentTerm}
          renderContent={term => <CourseContent term={term} />}
        />
      </PageContainer>
    </>
  );
}
