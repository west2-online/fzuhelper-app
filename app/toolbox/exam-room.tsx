import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import FAQModal from '@/components/FAQModal';
import { Icon } from '@/components/Icon';
import ExamRoomCard from '@/components/academic/ExamRoomCard';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';
import { Text } from '@/components/ui/text';

import { ResultEnum } from '@/api/enum';
import { getApiV1JwchClassroomExam, getApiV1JwchTermList } from '@/api/generate';
import useApiRequest from '@/hooks/useApiRequest';
import { FAQ_EXAM_ROOM } from '@/lib/FAQ';
import { formatExamData } from '@/lib/exam-room';

// 处理API错误
const errorHandler = (data: any) => {
  if (data) {
    if (data.code === ResultEnum.BizErrorCode) {
      return;
    }
    toast.error(data.message || '发生未知错误，请稍后再试');
  }
};

interface TermContentProps {
  term: string;
}

const TermContent: React.FC<TermContentProps> = ({ term }) => {
  const screenWidth = Dimensions.get('window').width; // 获取屏幕宽度
  const { data, dataUpdatedAt, isLoading, refetch } = useApiRequest(getApiV1JwchClassroomExam, { term });
  const termData = formatExamData(data || []);
  const lastUpdated = new Date(dataUpdatedAt);

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      className="grow"
      style={{ width: screenWidth }}
    >
      {/* 渲染考试数据 */}
      <SafeAreaView edges={['bottom']}>
        {termData.length > 0 ? (
          termData.map((item, idx) => (
            <View key={idx} className="mx-4">
              <ExamRoomCard item={item} />
            </View>
          ))
        ) : (
          <Text className="text-center text-text-secondary">{isLoading ? '正在刷新中' : '暂无考试数据'}</Text>
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

export default function ExamRoomPage() {
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期
  const onSuccess = useCallback(
    (terms: string[]) => {
      if (!currentTerm && terms.length) {
        setCurrentTerm(terms[0]);
      }
    },
    [currentTerm],
  );
  // 获取学期列表（当前用户）
  const { data: termList } = useApiRequest(
    getApiV1JwchTermList,
    {},
    {
      onSuccess,
      errorHandler,
    },
  );
  const [showFAQ, setShowFAQ] = useState(false); // 是否显示 FAQ

  // 处理 Modal 显示事件
  const handleModalVisible = useCallback(() => {
    setShowFAQ(prev => !prev);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitleAlign: 'center',
          headerTitle: '考场查询',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <Pressable onPress={handleModalVisible} className="flex flex-row items-center">
              <Icon name="help-circle-outline" size={26} className="mr-4" />
            </Pressable>
          ),
        }}
      />

      <PageContainer>
        <TabFlatList
          data={termList ?? []}
          value={currentTerm}
          onChange={setCurrentTerm}
          renderContent={term => <TermContent term={term} />}
        />
      </PageContainer>

      {/* FAQ Modal */}
      <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} data={FAQ_EXAM_ROOM} />
    </>
  );
}
