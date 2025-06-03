import { Tabs } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Icon } from '@/components/Icon';
import GradeCard from '@/components/academic/GradeCard';
import SemesterSummaryCard from '@/components/academic/SemesterSummaryCard';
import FAQModal from '@/components/faq-modal';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';
import { Text } from '@/components/ui/text';

import { JwchAcademicScoresResponse_AcademicScoresDataItem } from '@/api/backend';
import { getApiV1JwchAcademicScores, getApiV1JwchTermList } from '@/api/generate';
import useApiRequest from '@/hooks/useApiRequest';
import { FAQ_COURSE_GRADE } from '@/lib/FAQ';
import { calSingleTermSummary, parseScore } from '@/lib/grades';

const errorHandler = (data: any) => {
  if (data) {
    toast.error(data.message || '发生未知错误，请稍后再试');
  }
};

interface TermContentProps {
  termData: JwchAcademicScoresResponse_AcademicScoresDataItem[];
  isLoading: boolean;
  dataUpdatedAt: number;
  onRefresh?: () => void;
}

// 单个学期的内容
const TermContent: React.FC<TermContentProps> = ({ termData, isLoading, dataUpdatedAt, onRefresh }) => {
  const screenWidth = Dimensions.get('window').width; // 获取屏幕宽度
  const lastUpdated = new Date(dataUpdatedAt);
  const summary = useMemo(() => calSingleTermSummary(termData), [termData]);

  return (
    <ScrollView
      style={{ width: screenWidth }}
      // eslint-disable-next-line react-native/no-inline-styles
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => {
            onRefresh?.();
          }}
        />
      }
    >
      {termData.length > 0 && summary && (
        <View className="mx-4">
          <SemesterSummaryCard summary={summary} />
        </View>
      )}

      <SafeAreaView edges={['bottom']}>
        {termData.length > 0 ? (
          termData
            .sort((a, b) => parseScore(b.score) - parseScore(a.score))
            .map((item, index) => (
              <View key={index} className="mx-4 mt-4">
                <GradeCard item={item} />
              </View>
            ))
        ) : (
          <Text className="text-center text-gray-500">暂无成绩数据</Text>
        )}
        {termData.length > 0 && (
          <View className="my-4 flex flex-row items-center justify-center">
            <Icon name="time-outline" size={16} className="mr-2" />
            <Text className="text-sm leading-5 text-text-primary">
              数据同步时间：{(lastUpdated && lastUpdated.toLocaleString()) || '请进行一次同步'}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </ScrollView>
  );
};

export default function GradesPage() {
  const [currentTerm, setCurrentTerm] = useState<string>(''); // 当前学期

  // 只在首次加载（terms 存在且 currentTerm 为空）时设置 currentTerm
  const onSuccess = useCallback(
    async (terms: string[]) => {
      if (terms.length > 0 && !currentTerm) {
        setCurrentTerm(terms[0]);
      }
    },
    [currentTerm],
  );

  // 获取学期列表（当前用户），此处不使用 usePersistedQuery
  // 这和课表的 getApiV1TermsList 不一致，前者（即 getApiV1JwchTermList）只返回用户就读的学期列表
  const {
    data: termList,
    isLoading: isLoadingTermList,
    refetch: refetchTermList,
  } = useApiRequest(getApiV1JwchTermList, {}, { onSuccess, errorHandler });
  // 访问 west2-online 服务器获取成绩数据（由于教务处限制，只能获取全部数据）
  // 由于教务处限制，成绩数据会直接返回所有课程的成绩，我们需要在本地进行区分，因此引入了下一个获取学期列表的函数
  const {
    data: academicData,
    dataUpdatedAt: academicDataUpdatedAt,
    isLoading: isLoadingAcademicData,
    refetch: refetchAcademicData,
  } = useApiRequest(getApiV1JwchAcademicScores, {}, { errorHandler, retry: 0 });
  const [showFAQ, setShowFAQ] = useState(false); // 是否显示 FAQ 模态框

  // 处理 Modal 显示事件
  const handleModalVisible = useCallback(() => {
    setShowFAQ(prev => !prev);
  }, []);

  return (
    <>
      <Tabs.Screen
        options={{
          title: '成绩查询',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <Pressable onPress={handleModalVisible} className="flex flex-row items-center">
              <Icon name="help-circle-outline" size={26} className="mr-4" />
            </Pressable>
          ),
        }}
      />

      <PageContainer>
        {isLoadingTermList && isLoadingAcademicData ? (
          <Loading />
        ) : (
          <TabFlatList
            data={termList ?? []}
            value={currentTerm}
            onChange={setCurrentTerm}
            renderContent={term => (
              <TermContent
                termData={(academicData ?? []).filter(it => it.term === term)}
                onRefresh={() => {
                  refetchTermList();
                  refetchAcademicData();
                }}
                dataUpdatedAt={academicDataUpdatedAt}
                isLoading={isLoadingTermList && isLoadingAcademicData}
              />
            )}
          />
        )}

        {/* FAQ Modal */}
        <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} data={FAQ_COURSE_GRADE} />
      </PageContainer>
    </>
  );
}
