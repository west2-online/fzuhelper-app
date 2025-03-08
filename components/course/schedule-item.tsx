import { useState } from 'react';
import { Pressable, useColorScheme, View } from 'react-native';

import { Text } from '@/components/ui/text';

import OverlapIcon from '@/assets/images/course/overlap.svg';
import { SCHEDULE_ITEM_MARGIN, type ExtendCourse } from '@/lib/course';
import { getCourseColor } from '@/utils/random-color';

import ScheduleDetailsDialog from './schedule-detail-dialog';

interface ScheduleItemProps {
  schedules: ExtendCourse[];
  itemHeight: number;
  span: number;
  color: string; // 课程的颜色
}

// ScheduleItem 组件，用于显示课程表中的一节课
const ScheduleItem: React.FC<ScheduleItemProps> = ({ schedules, itemHeight, span, color }) => {
  const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const colorScheme = useColorScheme();

  return (
    <>
      <View style={{ padding: SCHEDULE_ITEM_MARGIN, height: span * itemHeight }}>
        <Pressable
          className="flex flex-1 flex-col items-center justify-center rounded-lg p-[1px]"
          style={{
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
      </View>

      {/* 课程详情 */}
      <ScheduleDetailsDialog open={isDetailsDialogOpen} onOpenChange={setDetailsDialogOpen} schedules={schedules} />
    </>
  );
};

export default ScheduleItem;
