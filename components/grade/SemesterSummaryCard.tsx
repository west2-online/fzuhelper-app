import { Text } from '@/components/ui/text';
import { SemesterSummary } from '@/types/grades';
import { View } from 'react-native';

interface SemesterSummaryCardProps {
  summary: SemesterSummary;
}

export default function SemesterSummaryCard({ summary }: SemesterSummaryCardProps) {
  return (
    <View>
      <View className="mx-5 flex flex-row items-center justify-between">
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
          <Text className="text-sm text-gray-500">单科最低</Text>
          <Text className="text-lg font-bold text-gray-800">{summary.minScore.toFixed(2)}</Text>
        </View>
        <View className="flex flex-col items-start">
          <Text className="text-sm text-gray-500">学期 GPA</Text>
          <Text className="text-lg font-bold text-gray-800">{summary.GPA.toFixed(2) + ' #'}</Text>
        </View>
      </View>
      <View className="mx-5 flex flex-row items-center justify-between">
        <Text className="text-sm text-gray-500"># 单一学期GPA 非学校教务系统数据，可能存在误差，仅供参考</Text>
      </View>
    </View>
  );
}
