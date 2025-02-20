import { Text } from '@/components/ui/text';
import { SemesterSummary } from '@/types/academic';
import { View } from 'react-native';
import { Card } from '../ui/card';

interface SemesterSummaryCardProps {
  summary: SemesterSummary;
}

export default function SemesterSummaryCard({ summary }: SemesterSummaryCardProps) {
  return (
    <Card className="mt-3 p-3">
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-col items-start">
          <Text className="text-text-primary text-sm">总课程数</Text>
          <Text className="text-text-primary text-lg font-bold">{summary.totalCount}</Text>
        </View>
        <View className="flex flex-col items-start">
          <Text className="text-text-primary text-sm">应修学分</Text>
          <Text className="text-text-primary text-lg font-bold">{summary.totalCredit.toFixed(2)}</Text>
        </View>
        <View className="flex flex-col items-start">
          <Text className="text-text-primary text-sm">单科最高</Text>
          <Text className="text-text-primary text-lg font-bold">{summary.maxScore.toFixed(2)}</Text>
        </View>
        <View className="flex flex-col items-start">
          <Text className="text-text-primary text-sm">学期绩点</Text>
          <Text className="text-text-primary text-lg font-bold">{summary.GPA.toFixed(2) + ' #'}</Text>
        </View>
      </View>
      <View className="flex flex-row items-center justify-between">
        <Text className="text-text-secondary text-sm"># 单学期绩点非学校教务系统数据，可能存在误差，仅供参考</Text>
      </View>
    </Card>
  );
}
