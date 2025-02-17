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
        className="flex flex-shrink-0 flex-grow-0 basis-0 flex-col items-center justify-center rounded-lg border p-[1px]"
        style={{
          flexGrow: span,
          height: span * (height / 11),
          borderColor: color,
          backgroundColor: `${color}33`,
        }}
        onPress={() => setDetailsDialogOpen(true)}
      >
        <Text className="truncate text-wrap break-all text-center text-[11px] font-bold text-muted-foreground">
          {schedule.name}
        </Text>
        <Text className="text-wrap break-all text-[11px] text-muted-foreground">{schedule.location}</Text>

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
