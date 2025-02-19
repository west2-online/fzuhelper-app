import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { parseScoreToColor } from '@/lib/grades'; // 确保路径正确
import { CourseGradesData } from '@/types/grades'; // 确保路径正确
import React from 'react';
import { View } from 'react-native';

interface GradeCardProps {
  item: CourseGradesData;
}

const GradeCard: React.FC<GradeCardProps> = ({ item }) => {
  return (
    <Card className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <View className="mb-1 flex flex-row items-center justify-between">
        {/* 课程名称 */}
        <Text className="break-words text-base font-semibold leading-tight text-gray-800">{item.name}</Text>
        {/* 考试类型 */}
        <Text className="text-sm text-gray-500">{item.exam_type}</Text>
      </View>
      {/* 授课教师 */}
      <Text className="mt-1 truncate text-xs text-gray-600">{item.teacher}</Text>
      {/* 分割线 */}
      <View className="my-1 border-b border-gray-300" />
      <View className="mt-1 flex flex-row items-center justify-between">
        {/* 左侧：应获学分和获得绩点 */}
        <View className="flex w-2/5 flex-row justify-between">
          {/* 应获学分 */}
          <View className="flex flex-col items-start">
            <Text className="text-xs text-gray-500">获得学分</Text>
            <Text className="text-lg font-bold">{item.gpa ? item.credit : '—'}</Text>
          </View>
          {/* 获得绩点 */}
          <View className="flex flex-col items-start">
            <Text className="text-xs text-gray-500">获得绩点</Text>
            <Text className="text-lg font-bold text-blue-500">{item.gpa || '—'}</Text>
          </View>
        </View>
        {/* 右侧：成绩 */}
        <View className="items-right flex w-1/2 flex-col items-end">
          <Text className="text-3xl font-bold" style={{ color: parseScoreToColor(item.score) }}>
            {item.score}
          </Text>
        </View>
      </View>
    </Card>
  );
};

export default GradeCard;
