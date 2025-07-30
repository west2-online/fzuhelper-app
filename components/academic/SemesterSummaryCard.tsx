import { Text } from '@/components/ui/text';
import { LocalUser, USER_TYPE_UNDERGRADUATE } from '@/lib/user';
import { SemesterSummary } from '@/types/academic';
import { memo } from 'react';
import { View } from 'react-native';
import { Card } from '../ui/card';

interface SemesterSummaryCardProps {
  summary: SemesterSummary;
}

function SemesterSummaryCard({ summary }: SemesterSummaryCardProps) {
  return (
    <Card className="mt-3 p-3">
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-col items-start">
          <Text className="text-sm text-text-primary">总课程数</Text>
          <Text className="text-lg font-bold text-text-primary">{summary.totalCount}</Text>
        </View>
        <View className="flex flex-col items-start">
          <Text className="text-sm text-text-primary">应修学分</Text>
          <Text className="text-lg font-bold text-text-primary">{summary.totalCredit.toFixed(2)}</Text>
        </View>
        <View className="flex flex-col items-start">
          <Text className="text-sm text-text-primary">单科最高</Text>
          <Text className="text-lg font-bold text-text-primary">{summary.maxScore.toFixed(2)}</Text>
        </View>
        {LocalUser.getUser().type === USER_TYPE_UNDERGRADUATE && (
          <View className="flex flex-col items-start">
            <Text className="text-sm text-text-primary">学期绩点</Text>
            <Text className="text-lg font-bold text-text-primary">{summary.GPA.toFixed(2) + ' #'}</Text>
          </View>
        )}
      </View>
      <View className="flex flex-row items-center justify-between">
        <Text className="text-sm text-text-secondary"># 单学期绩点非学校教务系统数据，可能存在误差，仅供参考</Text>
      </View>
    </Card>
  );
}

export default memo(SemesterSummaryCard);
