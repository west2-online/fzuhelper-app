import { memo } from 'react';
import { ScrollView, View, type LayoutRectangle } from 'react-native';

import CalendarCol from './calendar-col';
import TimeCol from './time-col';

import type { ParsedCourse } from '@/utils/course';

interface CourseWeekProps {
  week: number;
  startDate: string;
  schedules: ParsedCourse[];
  courseColorMap: Record<string, string>;
  showNonCurrentWeekCourses: boolean;
  flatListLayout: LayoutRectangle;
}

// CourseWeek 组件，用于渲染一周的课程表
const CourseWeek: React.FC<CourseWeekProps> = ({
  week,
  startDate,
  schedules,
  courseColorMap,
  showNonCurrentWeekCourses,
  flatListLayout,
}) => (
  <ScrollView className="flex-1">
    <View className="flex flex-row">
      <TimeCol />

      <View className="flex flex-1 flex-row">
        {/* 按列（即每一天）渲染课程表 */}
        {Array.from({ length: 7 }, (_, i) => (
          <CalendarCol
            key={`${startDate}_${i}`}
            week={week}
            weekday={i + 1}
            schedules={schedules}
            courseColorMap={courseColorMap}
            isShowNonCurrentWeekCourses={showNonCurrentWeekCourses}
            flatListLayout={{ ...flatListLayout, width: flatListLayout.width - 32 }}
          />
        ))}
      </View>
    </View>
  </ScrollView>
);

export default memo(CourseWeek);
