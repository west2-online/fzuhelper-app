import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { MergedExamData } from '@/types/academic';
import { formatCourseName } from '@/utils/course-format';
import { formatDate } from '@/utils/date-format';

import { memo } from 'react';

interface CourseCardProps {
  item: MergedExamData;
}

const ExamRoomCard: React.FC<CourseCardProps> = ({ item }) => (
  <Card className={cn('p-3', item.isFinished && 'opacity-50')}>
    {/* 考试课程 */}
    <View className="m-1 flex flex-row items-center justify-start">
      <View className="flex flex-shrink flex-grow flex-row items-center">
        <Icon name={item.isFinished ? 'checkmark-circle' : 'alert-circle'} size={16} className="mr-2" />
        <Text className="mr-1 flex-shrink font-bold" numberOfLines={1}>
          {formatCourseName(item.name)}
        </Text>
        {item.credit !== undefined && item.credit !== '0' && (
          <Text className="mr-2 flex-shrink-0 text-sm text-text-secondary"> ({item.credit} 学分)</Text>
        )}
      </View>

      <Text className="flex-shrink-0 justify-self-end text-ellipsis" numberOfLines={1}>
        {item.teacher}
      </Text>
    </View>

    {/* 分割线 */}
    {(item.date || item.time || item.location) && <View className="m-1 border-b border-border" />}

    {/* 日期 */}
    {(item.date || item.time) && (
      <View className="m-1 flex flex-row items-center">
        <Icon name="calendar" size={16} className="mr-2" />
        {item.date && <Text>{formatDate(item.date)} </Text>}
        {item.time && <Text>{item.time}</Text>}
      </View>
    )}

    {/* 考场位置 */}
    {item.location && (
      <View className="m-1 flex flex-row items-center">
        <Icon name="location" size={16} className="mr-2" />
        <Text>{item.location}</Text>
      </View>
    )}
  </Card>
);

export default memo(ExamRoomCard);
