import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { Icon } from '@/components/Icon';
import ExamRoomCard from '@/components/academic/ExamRoomCard';
import FAQModal from '@/components/faq-modal';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';
import { Text } from '@/components/ui/text';

import { ResultEnum } from '@/api/enum';
import { getApiV1JwchClassroomExam, getApiV1JwchTermList } from '@/api/generate';
import Loading from '@/components/loading';
import useApiRequest from '@/hooks/useApiRequest';
import { FAQ_EXAM_ROOM } from '@/lib/FAQ';
import { formatExamData } from '@/lib/exam-room';
import { MergedExamData } from '@/types/academic';
import React from 'react';

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

const TermContent = React.memo<TermContentProps>(({ term }) => {
  const screenWidth = Dimensions.get('window').width; // 获取屏幕宽度
  const { data, dataUpdatedAt, isLoading, refetch } = useApiRequest(getApiV1JwchClassroomExam, { term });
  const termData = formatExamData(data || []).sort((a, b) => {
    const now = new Date(); // 当前日期
    // 排序优先级 最近的考试 > 稍近的考试 > 过期的考试 > 没有日期的考试

    // 如果只有一个有 date，优先排序有 date 的
    if (!a.date && b.date) return 1; // a 没有 date，b 有 date，b 优先
    if (a.date && !b.date) return -1; // a 有 date，b 没有 date，a 优先

    // 如果两个都没有 date，保持原顺序
    if (!a.date && !b.date) return 0;

    // 两者都有 date，确保 date 是有效的
    const dateA = new Date(a.date!); // 使用非空断言（!）告诉 TypeScript 这里一定有值
    const dateB = new Date(b.date!);

    // 如果一个未完成一个已完成，未完成优先
    if (a.isFinished && !b.isFinished) return 1; // a 已完成，b 未完成，b 优先
    if (!a.isFinished && b.isFinished) return -1; // a 未完成，b 已完成，a 优先

    // 计算与当前日期的时间差
    const diffA = Math.abs(dateA.getTime() - now.getTime());
    const diffB = Math.abs(dateB.getTime() - now.getTime());

    // 时间差小的优先
    return diffA - diffB;
  });
  const lastUpdated = useMemo(() => new Date(dataUpdatedAt), [dataUpdatedAt]);
  const { bottom } = useSafeAreaInsets();
  const contentContainerStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);
  const flatListStyle = useMemo(() => ({ width: screenWidth }), [screenWidth]);

  const keyExtractor = useCallback((item: MergedExamData, index: number) => `${item.name}-${index}`, []);

  const renderItem = useCallback(({ item }: { item: MergedExamData }) => {
    return <ExamRoomCard item={item} />;
  }, []);

  const renderListEmptyComponent = useMemo(() => {
    if (isLoading) {
      return null;
    }
    return <Text className="text-center text-text-secondary">暂无考试数据</Text>;
  }, [isLoading]);

  const renderListFooterComponent = useMemo(() => {
    if (termData.length > 0) {
      return (
        <View className="my-4 flex flex-row items-center justify-center">
          <Icon name="time-outline" size={16} className="mr-2" />
          <Text className="text-sm leading-5 text-text-primary">
            数据同步时间：{(lastUpdated && lastUpdated.toLocaleString()) || '请进行一次同步'}
          </Text>
        </View>
      );
    }
    return null;
  }, [termData.length, lastUpdated]);

  return (
    <FlatList
      data={termData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      contentContainerStyle={contentContainerStyle}
      contentContainerClassName="mt-3 mx-4 gap-3"
      style={flatListStyle}
      ListEmptyComponent={renderListEmptyComponent}
      ListFooterComponent={renderListFooterComponent}
    />
  );
});

TermContent.displayName = 'TermContent';

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
  const { data: termList, isLoading: isLoadingTermList } = useApiRequest(
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

  const headerRight = useCallback(
    () => (
      <Pressable onPress={handleModalVisible} className="flex flex-row items-center">
        <Icon name="help-circle-outline" size={26} className="mr-4" />
      </Pressable>
    ),
    [handleModalVisible],
  );

  const renderContent = useCallback((term: string) => {
    return <TermContent term={term} />;
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: '考场查询',
          headerRight: headerRight,
        }}
      />

      <PageContainer>
        {isLoadingTermList ? (
          <Loading />
        ) : (
          <TabFlatList
            data={termList ?? []}
            value={currentTerm}
            onChange={setCurrentTerm}
            renderContent={renderContent}
          />
        )}
      </PageContainer>

      {/* FAQ Modal */}
      <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} data={FAQ_EXAM_ROOM} />
    </>
  );
}
