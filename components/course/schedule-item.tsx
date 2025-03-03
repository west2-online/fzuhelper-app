import { useState } from 'react';
import { Pressable, useColorScheme, View } from 'react-native';

import OverlapIcon from '@/assets/images/course/overlap.svg';
import { Text } from '@/components/ui/text';
import ScheduleDetailsDialog from './schedule-detail-dialog';

import { type ExtendCourse } from '@/lib/course';
import { getCourseColor } from '@/utils/random-color';

interface ScheduleItemProps {
  schedules: ExtendCourse[];
  height: number;
  span: number;
  color: string; // 课程的颜色
}

// ScheduleItem 组件，用于显示课程表中的一节课
const ScheduleItem: React.FC<ScheduleItemProps> = ({ schedules, height, span, color }) => {
  const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const colorScheme = useColorScheme();

  return (
    <>
      <Pressable
        className="m-[1px] flex flex-col items-center justify-center rounded-lg p-[1px]"
        style={{
          height: span * (height / 11) + (span - 1) * 2, // 补充 2px, 使得跨多个的课程的纵向高度包含了原有的margin，达到对齐
          backgroundColor: getCourseColor(color, colorScheme === 'dark'),
        }}
        onPress={() => setDetailsDialogOpen(true)}
      >
        <Text className="line-clamp-3 truncate text-wrap break-all text-center text-[11px] text-white">
          {schedules[0].name}
        </Text>
        <Text className="mt-1 text-wrap break-all text-center text-[11px] text-white">{schedules[0].location}</Text>

        {schedules.length > 1 && (
          <View className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-[3px] bg-white">
            <OverlapIcon width={10} height={10} />
          </View>
        )}
      </Pressable>

      {/* 课程详情 */}
      <ScheduleDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        schedules={schedules}
      />
    </>
  );
};

export default ScheduleItem;
