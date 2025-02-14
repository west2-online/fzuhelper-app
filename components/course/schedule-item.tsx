import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';

import { CLASS_SCHEDULES } from '@/lib/constants';
import type { ParsedCourse } from '@/utils/course';

interface ScheduleItemProps {
  schedule: ParsedCourse;
  overlappingSchedules?: ParsedCourse[]; // 重叠的课程
  isPartialOverlap?: boolean; // 是否部分重叠
  height: number;
  span: number;
  color: string; // 课程的颜色
  onSyllabusPress: (syllabus: string) => void; // 教学大纲点击事件
  onLessonPlanPress: (lessonPlan: string) => void; // 授课计划点击事件
}

// 根据节数获取时间范围
const getTimeRange = (startClass: number, endClass: number): string => {
  const startTime = CLASS_SCHEDULES[startClass - 1][0];
  const endTime = CLASS_SCHEDULES[endClass - 1][1];
  return `${startTime} - ${endTime}`;
};

const ScheduleItem: React.FC<ScheduleItemProps> = ({
  schedule,
  height,
  span,
  color,
  overlappingSchedules,
  isPartialOverlap,
  onSyllabusPress,
  onLessonPlanPress,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false); // 控制课程详情弹窗
  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false); // 控制重叠课程弹窗
  const [isPartialOverlapDialogOpen, setIsPartialOverlapDialogOpen] = useState(false); // 控制遮挡课程弹窗

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Pressable
            className="flex min-h-14 flex-shrink-0 flex-grow-0 basis-0 flex-col items-center justify-center rounded-lg border p-[1px]"
            style={{
              flexGrow: span,
              height: (span / 11) * height,
              borderColor: color,
              backgroundColor: `${color}33`,
            }}
          >
            <Text className="truncate text-wrap break-all text-center text-[11px] font-bold text-muted-foreground">
              {schedule.name}
            </Text>
            <Text className="text-wrap break-all text-[11px] text-muted-foreground">{schedule.location}</Text>
            {overlappingSchedules && overlappingSchedules.length > 1 && (
              <Pressable
                onPress={() => setIsOverlapDialogOpen(true)} // 打开重叠课程弹窗
                className="mt-1 flex flex-row items-center justify-center"
              >
                <Text className="text-xs font-bold text-primary">有重叠</Text>
              </Pressable>
            )}
            {isPartialOverlap && (
              <Text
                className="mt-1 text-xs text-destructive"
                onPress={() => setIsPartialOverlapDialogOpen(true)} // 打开遮挡课程弹窗
              >
                有遮挡
              </Text>
            )}
          </Pressable>
        </DialogTrigger>

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
            <Button
              variant="link"
              onPress={() => {
                setIsDialogOpen(false);
                onSyllabusPress(schedule.syllabus);
              }}
            >
              <Text className="text-primary">教学大纲</Text>
            </Button>
            <Button
              variant="link"
              onPress={() => {
                setIsDialogOpen(false);
                onLessonPlanPress(schedule.lessonplan);
              }}
            >
              <Text className="text-primary">授课计划</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>

      {/* 重叠课程弹窗 */}
      {overlappingSchedules && overlappingSchedules.length > 1 && (
        <Dialog open={isOverlapDialogOpen} onOpenChange={setIsOverlapDialogOpen}>
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
      )}

      {/* 遮挡课程弹窗 */}
      {isPartialOverlap && (
        <Dialog open={isPartialOverlapDialogOpen} onOpenChange={setIsPartialOverlapDialogOpen}>
          <DialogContent className="flex w-[90vw] flex-col justify-center pb-6 pt-10 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-warning text-center text-primary">遮挡课程详情</DialogTitle>
            </DialogHeader>
            {overlappingSchedules &&
              overlappingSchedules.map((overlap, index) => (
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
                      <Text>时间</Text>
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      <Text>
                        第 {overlap.startClass}-{overlap.endClass} 节 (
                        {getTimeRange(overlap.startClass, overlap.endClass)})
                      </Text>
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
                </DescriptionList>
              ))}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ScheduleItem;
