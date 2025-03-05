import { useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import ArrowRightIcon from '@/assets/images/misc/ic_arrow_right.png';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';

import { CourseCache, type ExtendCourse } from '@/lib/course';
import { pushToWebViewJWCH } from '@/lib/webview';

interface ScheduleDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: ExtendCourse[];
}

const ScheduleDetailsDialog: React.FC<ScheduleDetailsDialogProps> = ({ isOpen, onClose, schedules }) => {
  const [scheduleIndex, setScheduleIndex] = useState(0);
  const schedule = useMemo(() => schedules[scheduleIndex], [scheduleIndex, schedules]);
  const scheduleIsSingleOnly = useMemo(() => !schedule.double && schedule.single, [schedule.double, schedule.single]);
  const scheduleIsDoubleOnly = useMemo(() => schedule.double && !schedule.single, [schedule.double, schedule.single]);

  const closeDialog = () => {
    onClose();
    setScheduleIndex(0);
  };

  const handleSyllabusPress = () => {
    closeDialog();
    pushToWebViewJWCH(schedule.syllabus, '教学大纲');
  };

  const handleLessonplanPress = () => {
    closeDialog();
    pushToWebViewJWCH(schedule.lessonplan, '授课计划');
  };

  const setPriority = (index: number) => {
    closeDialog();
    CourseCache.setPriority(index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="flex w-[90vw] flex-col justify-center pb-6 pt-10 sm:max-w-[425px]">
        <View className="flex flex-row items-center justify-between">
          {/* 向左按钮 */}
          <Pressable
            className={`flex-none ${schedules.length <= 1 ? 'invisible' : ''}`}
            onPress={() =>
              schedules.length > 1 && setScheduleIndex(scheduleIndex === 0 ? schedules.length - 1 : scheduleIndex - 1)
            }
          >
            <Image className="m-1 h-5 w-5" source={ArrowRightIcon} style={{ transform: [{ scaleX: -1 }] }} />
          </Pressable>
          <View className="flex flex-1 flex-col">
            <DialogHeader>
              <DialogTitle className="text-center text-primary">{schedule.name}</DialogTitle>
            </DialogHeader>
            <View className="flex w-full flex-row justify-center">
              <View>
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
                      <Text className="text-wrap break-all">{schedule.teacher}</Text>
                    </DescriptionListDescription>
                  </DescriptionListRow>
                  <DescriptionListRow>
                    <DescriptionListTerm>
                      <Text>节数</Text>
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      <Text>
                        {schedule.startClass}-{schedule.endClass} 节
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
                        {/* 单双周显示，仅在只有单周/双周上课的时候才显示提示 */}
                        {scheduleIsSingleOnly && ' [单]'}
                        {scheduleIsDoubleOnly && ' [双]'}
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
                  {schedule.syllabus.length > 0 && (
                    <Button variant="link" onPress={handleSyllabusPress}>
                      <Text className="text-primary">教学大纲</Text>
                    </Button>
                  )}
                  {schedule.lessonplan.length > 0 && (
                    <Button variant="link" onPress={handleLessonplanPress}>
                      <Text className="text-primary">授课计划</Text>
                    </Button>
                  )}
                  {schedules.length > 1 && scheduleIndex > 0 && (
                    <Button
                      variant="link"
                      onPress={() => {
                        setPriority(schedule.id); // 调用 setPriority 函数，传入当前 schedule 的 id
                      }}
                    >
                      <Text className="text-primary">优先显示</Text>
                    </Button>
                  )}
                </View>
              </View>
            </View>
          </View>
          {/* 向右按钮 */}
          <Pressable
            className={`flex-none ${schedules.length <= 1 ? 'invisible' : ''}`}
            onPress={() =>
              schedules.length > 1 && setScheduleIndex(scheduleIndex === schedules.length - 1 ? 0 : scheduleIndex + 1)
            }
          >
            <Image className="m-1 h-5 w-5" source={ArrowRightIcon} />
          </Pressable>
        </View>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDetailsDialog;
