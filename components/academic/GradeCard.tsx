import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { parseScoreToColor } from '@/lib/grades';
import { LocalUser, USER_TYPE_UNDERGRADUATE } from '@/lib/user';
import { CourseGradesData } from '@/types/academic';
import React from 'react';
import { View } from 'react-native';

interface GradeCardProps {
  item: CourseGradesData;
}

const GradeCard: React.FC<GradeCardProps> = ({ item }) => {
  return (
    <Card className="p-3">
      <View className="mb-1 flex flex-row items-center justify-between">
        {/* 课程名称 */}
        <Text className="break-words text-base font-semibold leading-tight text-text-primary">{item.name}</Text>
        {/* 考试类型 */}
        <Text className="text-sm text-text-secondary">{item.exam_type}</Text>
      </View>
      {/* 授课教师和课程类型 */}
      <View className="mt-1 flex flex-row justify-between">
        {/* 授课教师 */}
        <Text className="truncate text-xs text-text-secondary">{item.teacher}</Text>
        {/* 课程类型 */}
        <Text className="truncate text-xs text-text-secondary">{item.elective_type}</Text>
      </View>
      {/* 分割线 */}
      <View className="my-2 border-b border-border" />
      <View className="flex flex-row items-center justify-between">
        {/* 左侧：应获学分和获得绩点 */}
        <View className="flex w-2/5 flex-row justify-between">
          {/* 应获学分 */}
          <View className="flex flex-col items-start">
            <Text className="text-xs text-text-secondary">{item.gpa ? '获得' : '应得'}学分</Text>
            <Text className="text-lg font-bold">{item.credit}</Text>
          </View>
          {/* 获得绩点 */}
          {LocalUser.getUser().type === USER_TYPE_UNDERGRADUATE && (
            <View className="flex flex-col items-start">
              <Text className="text-xs text-text-secondary">获得绩点</Text>
              <Text className="text-lg font-bold text-primary">{item.gpa || '—'}</Text>
            </View>
          )}
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
