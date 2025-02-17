import { useState } from 'react';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import OverlapDetailsDialog from './overlap-details-dialog';
import PartialOverlapDialog from './partial-overlap-dialog';
import ScheduleDetailsDialog from './schedule-detail-item';

import { type ParsedCourse } from '@/utils/course';

interface ScheduleItemProps {
  schedule: ParsedCourse;
  overlappingSchedules?: ParsedCourse[]; // 重叠的课程
  isPartialOverlap?: boolean; // 是否部分重叠
  height: number;
  span: number;
  color: string; // 课程的颜色
}

// ScheduleItem 组件，用于显示课程表中的一节课
const ScheduleItem: React.FC<ScheduleItemProps> = ({
  schedule,
  height,
  span,
  color,
  overlappingSchedules,
  isPartialOverlap,
}) => {
  const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isOverlapDialogOpen, setOverlapDialogOpen] = useState(false);
  const [isPartialOverlapDialogOpen, setPartialOverlapDialogOpen] = useState(false);

  return (
    <>
      <Pressable
        className="m-[1px] flex flex-shrink-0 flex-grow-0 basis-0 flex-col items-center justify-center rounded-lg p-[1px]"
        style={{
          flexGrow: span,
          height: span * (height / 11) + (span - 1) * 2, // 补充2px, 使得跨多个的课程的纵向高度包含了原有的margin，达到对齐
          backgroundColor: color,
        }}
        onPress={() => setDetailsDialogOpen(true)}
      >
        <Text className="line-clamp-3 truncate text-wrap break-all text-center text-[11px] text-white">
          {schedule.name}
        </Text>
        <Text className="mt-1 text-wrap break-all text-center text-[11px] text-white">{schedule.location}</Text>

        {overlappingSchedules && overlappingSchedules.length > 1 && (
          <Pressable
            onPress={() => setOverlapDialogOpen(true)}
            className="mt-1 flex flex-row items-center justify-center"
          >
            <Text className="text-xs font-bold text-primary">有重叠</Text>
          </Pressable>
        )}

        {isPartialOverlap && (
          <Text className="mt-1 text-xs text-destructive" onPress={() => setPartialOverlapDialogOpen(true)}>
            有遮挡
          </Text>
        )}
      </Pressable>

      {/* 排课详情 */}
      <ScheduleDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        schedule={schedule}
      />

      {/* 如果有重叠课程，则显示 */}
      {overlappingSchedules && overlappingSchedules.length > 1 && (
        <OverlapDetailsDialog
          isOpen={isOverlapDialogOpen}
          onClose={() => setOverlapDialogOpen(false)}
          overlappingSchedules={overlappingSchedules}
        />
      )}

      {/* 如果有部分重叠课程，则显示被遮挡的课程 */}
      {isPartialOverlap && overlappingSchedules && (
        <PartialOverlapDialog
          isOpen={isPartialOverlapDialogOpen}
          onClose={() => setPartialOverlapDialogOpen(false)}
          overlappingSchedules={overlappingSchedules}
        />
      )}
    </>
  );
};

export default ScheduleItem;
