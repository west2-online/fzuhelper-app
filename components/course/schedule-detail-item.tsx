import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { type ParsedCourse } from '@/utils/course';
import React from 'react';
import { View } from 'react-native';

import { CLASS_SCHEDULES } from '@/lib/constants';
import { pushToWebViewJWCH } from '@/lib/webview';

// 根据节数获取时间范围
const getTimeRange = (startClass: number, endClass: number): string => {
  const startTime = CLASS_SCHEDULES[startClass - 1][0];
  const endTime = CLASS_SCHEDULES[endClass - 1][1];
  return `${startTime} - ${endTime}`;
};

interface ScheduleDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ParsedCourse;
}

const ScheduleDetailsDialog: React.FC<ScheduleDetailsDialogProps> = ({ isOpen, onClose, schedule }) => {
  const handleSyllabusPress = async () => {
    onClose();
    pushToWebViewJWCH(schedule.syllabus, '教学大纲');
  };

  const handleLessonplanPress = async () => {
    onClose();
    pushToWebViewJWCH(schedule.lessonplan, '授课计划');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-[90vw] flex-col justify-center pb-6 pt-10 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-primary">{schedule.name}</DialogTitle>
        </DialogHeader>
        <DescriptionList className="mx-6 mb-1 mt-4">
          <DescriptionListRow>
            <DescriptionListTerm>
              <Text>教室</Text>
            </DescriptionListTerm>
            <DescriptionListDescription>
              <Text>{schedule.location}</Text>
            </DescriptionListDescription>
          </DescriptionListRow>
          <DescriptionListRow>
            <DescriptionListTerm>
              <Text>教师</Text>
            </DescriptionListTerm>
            <DescriptionListDescription>
              <Text>{schedule.teacher}</Text>
            </DescriptionListDescription>
          </DescriptionListRow>
          <DescriptionListRow>
            <DescriptionListTerm>
              <Text>节数</Text>
            </DescriptionListTerm>
            <DescriptionListDescription>
              <Text>
                {schedule.startClass}-{schedule.endClass} 节 ({getTimeRange(schedule.startClass, schedule.endClass)})
              </Text>
            </DescriptionListDescription>
          </DescriptionListRow>
          <DescriptionListRow>
            <DescriptionListTerm>
              <Text>周数</Text>
            </DescriptionListTerm>
            <DescriptionListDescription>
              <Text>
                {schedule.startWeek}-{schedule.endWeek} 周
              </Text>
            </DescriptionListDescription>
          </DescriptionListRow>
          <DescriptionListRow>
            <DescriptionListTerm>
              <Text>备注</Text>
            </DescriptionListTerm>
            <DescriptionListDescription>
              <Text>{schedule.remark}</Text>
            </DescriptionListDescription>
          </DescriptionListRow>
        </DescriptionList>
        <View className="flex flex-row justify-evenly">
          <Button variant="link" onPress={handleSyllabusPress}>
            <Text className="text-primary">教学大纲</Text>
          </Button>
          <Button variant="link" onPress={handleLessonplanPress}>
            <Text className="text-primary">授课计划</Text>
          </Button>
        </View>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDetailsDialog;
