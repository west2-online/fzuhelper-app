import type { CourseInfo, CourseInfoMerged, WeekSegment } from './course';

type WeekPattern = Pick<WeekSegment, 'single' | 'double'>;
type DisplayWeekSegment = Pick<WeekSegment, 'startWeek' | 'endWeek'> & WeekPattern;

interface WeekDisplayGroup extends WeekPattern {
  ranges: string[];
}

const ADJUSTED_COURSE_PREFIX = /^\[调课\]\s*/;

const getCourseDisplayName = (course: CourseInfo) => course.name.replace(ADJUSTED_COURSE_PREFIX, '');

const getCourseMergeKey = (course: CourseInfo, displayName: string) =>
  JSON.stringify([course.weekday, displayName, course.startClass, course.endClass, course.location]);

const haveSameWeekPattern = (left: WeekPattern, right: WeekPattern) =>
  left.single === right.single && left.double === right.double;

const appendDisplaySegment = (segments: DisplayWeekSegment[], segment: DisplayWeekSegment) => {
  const lastSegment = segments[segments.length - 1];

  if (lastSegment && haveSameWeekPattern(lastSegment, segment) && segment.startWeek <= lastSegment.endWeek + 1) {
    lastSegment.endWeek = Math.max(lastSegment.endWeek, segment.endWeek);
    return;
  }

  segments.push({ ...segment });
};

const normalizeWeekSegmentsForDisplay = (weekSegments: WeekSegment[]): DisplayWeekSegment[] => {
  const validSegments = weekSegments.filter(
    segment => segment.startWeek <= segment.endWeek && (segment.single || segment.double),
  );
  const boundaries = Array.from(
    new Set(validSegments.flatMap(segment => [segment.startWeek, segment.endWeek + 1])),
  ).sort((a, b) => a - b);
  const normalized: DisplayWeekSegment[] = [];

  for (let index = 0; index < boundaries.length - 1; index++) {
    const startWeek = boundaries[index];
    const endWeek = boundaries[index + 1] - 1;
    const coveringSegments = validSegments.filter(
      segment => segment.startWeek <= startWeek && segment.endWeek >= endWeek,
    );

    if (coveringSegments.length === 0) continue;

    appendDisplaySegment(normalized, {
      startWeek,
      endWeek,
      single: coveringSegments.some(segment => segment.single),
      double: coveringSegments.some(segment => segment.double),
    });
  }

  return normalized;
};

const formatWeekRange = ({ startWeek, endWeek }: DisplayWeekSegment) =>
  startWeek === endWeek ? `${startWeek}` : `${startWeek}-${endWeek}`;

const formatWeekPattern = ({ single, double }: DisplayWeekSegment) => {
  if (single === double) return '';
  return `[${single ? '单' : '双'}]`;
};

export const formatWeekDisplay = (weekSegments: WeekSegment[]) => {
  const displayGroups: WeekDisplayGroup[] = [];

  for (const segment of normalizeWeekSegmentsForDisplay(weekSegments)) {
    const lastGroup = displayGroups[displayGroups.length - 1];

    if (lastGroup && haveSameWeekPattern(lastGroup, segment)) {
      lastGroup.ranges.push(formatWeekRange(segment));
    } else {
      displayGroups.push({ ranges: [formatWeekRange(segment)], single: segment.single, double: segment.double });
    }
  }

  return displayGroups.map(group => `${group.ranges.join(', ')}周${formatWeekPattern(group)}`).join('；');
};

export const isWeekInSegment = (segment: WeekSegment, week: number) => {
  if (week < segment.startWeek || week > segment.endWeek) return false;
  return week % 2 === 1 ? segment.single : segment.double;
};

export const isCourseScheduledInWeek = (course: CourseInfoMerged, week: number) =>
  course.weekSegments.some(segment => isWeekInSegment(segment, week));

export const mergeCourseSchedules = (schedules: CourseInfo[]): CourseInfoMerged[] => {
  const coursesBySchedule = new Map<string, { course: CourseInfo; displayName: string; weekSegments: WeekSegment[] }>();

  for (const course of schedules) {
    const displayName = getCourseDisplayName(course);
    const mergeKey = getCourseMergeKey(course, displayName);
    const weekSegment: WeekSegment = {
      startWeek: course.startWeek,
      endWeek: course.endWeek,
      isAdjusted: course.adjust,
      single: course.single,
      double: course.double,
    };
    const mergedCourse = coursesBySchedule.get(mergeKey);

    if (mergedCourse) {
      mergedCourse.weekSegments.push(weekSegment);
    } else {
      coursesBySchedule.set(mergeKey, { course, displayName, weekSegments: [weekSegment] });
    }
  }

  return Array.from(coursesBySchedule.values()).map(({ course, displayName, weekSegments }) => {
    const sortedWeekSegments = [...weekSegments].sort(
      (left, right) => left.startWeek - right.startWeek || left.endWeek - right.endWeek,
    );

    return {
      ...course,
      name: displayName,
      weekSegments: sortedWeekSegments,
      weekDisplay: formatWeekDisplay(sortedWeekSegments),
    };
  });
};

export const mergeCourseSchedulesByDay = (schedulesByDays: Record<number, CourseInfo[]>) =>
  Object.entries(schedulesByDays).reduce<Record<number, CourseInfoMerged[]>>((mergedSchedules, [day, schedules]) => {
    mergedSchedules[Number(day)] = mergeCourseSchedules(schedules);
    return mergedSchedules;
  }, {});
