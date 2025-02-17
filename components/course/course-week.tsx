import { memo } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View, type LayoutRectangle } from 'react-native';

import CalendarCol from './calendar-col';

import type { ParsedCourse } from '@/utils/course';

interface CourseWeekProps {
  week: number;
  startDate: string;
  schedules: ParsedCourse[];
  courseColorMap: Record<string, string>;
  showNonCurrentWeekCourses: boolean;
  flatListLayout: LayoutRectangle;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

// CourseWeek 组件，用于渲染一周的课程表
const CourseWeek: React.FC<CourseWeekProps> = ({
  week,
  startDate,
  schedules,
  courseColorMap,
  showNonCurrentWeekCourses,
  flatListLayout,
  onScroll,
}) => (
  <ScrollView
    className="flex-1"
    onScroll={onScroll}
    scrollEventThrottle={16}
    showsVerticalScrollIndicator={false}
    overScrollMode="never"
  >
    <View className="flex flex-row">
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
            flatListLayout={{ ...flatListLayout, width: flatListLayout.width }}
          />
        ))}
      </View>
    </View>
  </ScrollView>
);

export default memo(CourseWeek);
