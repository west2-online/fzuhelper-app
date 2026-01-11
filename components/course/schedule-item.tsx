import { memo, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

import OverlapIcon from '@/assets/images/course/overlap.svg';
import { SCHEDULE_ITEM_MARGIN, type CourseInfo } from '@/lib/course';
import { getCourseColor, getTextColor } from '@/utils/random-color';

import { useColorScheme } from 'nativewind';
import ScheduleDetailsDialog from './schedule-detail-dialog';

interface ScheduleItemProps {
  schedules: CourseInfo[];
  itemHeight: number;
  span: number;
  color: string; // 课程的颜色
}

// ScheduleItem 组件，用于显示课程表中的一节课
const ScheduleItem: React.FC<ScheduleItemProps> = ({ schedules, itemHeight, span, color }) => {
  const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDarkMode = useMemo(() => colorScheme === 'dark', [colorScheme]);

  return (
    <>
      <View style={{ padding: SCHEDULE_ITEM_MARGIN, height: span * itemHeight }}>
        <Pressable
          className="flex flex-1 flex-col items-center justify-center overflow-hidden rounded-lg p-[1px]"
          style={{
            backgroundColor: getCourseColor(color, isDarkMode),
          }}
          onPress={() => setDetailsDialogOpen(true)}
        >
          <Text
            className={`${span > 1 ? 'line-clamp-3' : 'line-clamp-2'} truncate text-wrap break-all text-center text-[11px]`}
            style={{ color: getTextColor(color, isDarkMode) }}
          >
            {schedules[0].name}
          </Text>
          <Text
            className="mt-1 text-wrap break-all text-center text-[11px]"
            style={{ color: getTextColor(color, isDarkMode) }}
          >
            {schedules[0].location}
          </Text>

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

export default memo(ScheduleItem);
