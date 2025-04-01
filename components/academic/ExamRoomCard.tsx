import dayjs from 'dayjs';
import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { MergedExamData } from '@/types/academic';

import { COURSE_SYMBOLS_MAP, DATE_FORMAT } from '@/lib/constants';

const SYMBOLS = Object.keys(COURSE_SYMBOLS_MAP);
const SYMBOLS_REGEX = new RegExp(`[${SYMBOLS.join('')}]`, 'g');

// 格式化日期
const formatDate = (date?: Date) => (date ? dayjs(date).format(DATE_FORMAT) : undefined);

// 获取课程名称（处理特殊符号映射）
const getCourseName = (name: string) =>
  name
    .replace(SYMBOLS_REGEX, symbol =>
      symbol in COURSE_SYMBOLS_MAP ? COURSE_SYMBOLS_MAP[symbol as keyof typeof COURSE_SYMBOLS_MAP] : symbol,
    )
    .trim();

interface CourseCardProps {
  item: MergedExamData;
}

// 课程卡片组件
const ExamRoomCard: React.FC<CourseCardProps> = ({ item }) => (
  <Card className={cn('m-1 p-3', item.isFinished && 'opacity-50')}>
    {/* 考试课程 */}
    <View className="m-1 flex flex-row items-center justify-start">
      <View className="flex flex-shrink-0 flex-grow flex-row items-center">
        <Icon name={item.isFinished ? 'checkmark-circle' : 'alert-circle'} size={16} className="mr-2" />
        <Text className="mr-1 font-bold" numberOfLines={1}>
          {getCourseName(item.name)}
        </Text>
        {item.credit !== undefined && item.credit !== '0' && (
          <Text className="mr-2 text-sm text-muted-foreground"> ({item.credit} 学分)</Text>
        )}
      </View>

      <Text className="flex-shrink flex-grow-0 justify-self-end text-ellipsis" numberOfLines={1}>
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

export default ExamRoomCard;
