import { Text } from '@/components/ui/text';
import { SemesterSummary } from '@/types/grades';
import { View } from 'react-native';
import { Card } from '../ui/card';

interface SemesterSummaryCardProps {
  summary: SemesterSummary;
}

export default function SemesterSummaryCard({ summary }: SemesterSummaryCardProps) {
  return (
    <Card className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-col items-start">
          <Text className="text-sm text-gray-500">总课程数</Text>
          <Text className="text-lg font-bold text-gray-800">{summary.totalCount}</Text>
        </View>
        <View className="flex flex-col items-start">
          <Text className="text-sm text-gray-500">应修学分</Text>
          <Text className="text-lg font-bold text-gray-800">{summary.totalCredit.toFixed(2)}</Text>
        </View>
        <View className="flex flex-col items-start">
          <Text className="text-sm text-gray-500">单科最高</Text>
          <Text className="text-lg font-bold text-gray-800">{summary.maxScore.toFixed(2)}</Text>
        </View>
        <View className="flex flex-col items-start">
          <Text className="text-sm text-gray-500">学期绩点</Text>
          <Text className="text-lg font-bold text-gray-800">{summary.GPA.toFixed(2) + ' #'}</Text>
        </View>
      </View>
      <View className="flex flex-row items-center justify-between">
        <Text className="text-sm text-gray-500"># 单学期绩点非学校教务系统数据，可能存在误差，仅供参考</Text>
      </View>
    </Card>
  );
}
