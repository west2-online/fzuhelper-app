import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { CLASS_SCHEDULES } from '@/lib/constants';
import { type ParsedCourse } from '@/utils/course';
import React from 'react';

// 根据节数获取时间范围
const getTimeRange = (startClass: number, endClass: number): string => {
  const startTime = CLASS_SCHEDULES[startClass - 1][0];
  const endTime = CLASS_SCHEDULES[endClass - 1][1];
  return `${startTime} - ${endTime}`;
};

interface OverlapDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  overlappingSchedules: ParsedCourse[];
}

const OverlapDetailsDialog: React.FC<OverlapDetailsDialogProps> = ({ isOpen, onClose, overlappingSchedules }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-[90vw] flex-col justify-center pb-6 pt-10 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-primary">重叠课程</DialogTitle>
        </DialogHeader>
        {overlappingSchedules.map((overlap, index) => (
          <DescriptionList key={index} className="mx-6 mb-2">
            <DescriptionListRow>
              <DescriptionListTerm>
                <Text>课程名</Text>
              </DescriptionListTerm>
              <DescriptionListDescription>
                <Text>{overlap.name}</Text>
              </DescriptionListDescription>
            </DescriptionListRow>
            <DescriptionListRow>
              <DescriptionListTerm>
                <Text>教室</Text>
              </DescriptionListTerm>
              <DescriptionListDescription>
                <Text>{overlap.location}</Text>
              </DescriptionListDescription>
            </DescriptionListRow>
            <DescriptionListRow>
              <DescriptionListTerm>
                <Text>教师</Text>
              </DescriptionListTerm>
              <DescriptionListDescription>
                <Text>{overlap.teacher}</Text>
              </DescriptionListDescription>
            </DescriptionListRow>
            <DescriptionListRow>
              <DescriptionListTerm>
                <Text>节数</Text>
              </DescriptionListTerm>
              <DescriptionListDescription>
                <Text>
                  {overlap.startClass}-{overlap.endClass} 节 ({getTimeRange(overlap.startClass, overlap.endClass)})
                </Text>
              </DescriptionListDescription>
            </DescriptionListRow>
            <DescriptionListRow>
              <DescriptionListTerm>
                <Text>周数</Text>
              </DescriptionListTerm>
              <DescriptionListDescription>
                <Text>
                  {overlap.startWeek}-{overlap.endWeek} 周
                </Text>
              </DescriptionListDescription>
            </DescriptionListRow>
          </DescriptionList>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default OverlapDetailsDialog;
