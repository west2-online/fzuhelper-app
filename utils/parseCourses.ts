import type { Course, CourseScheduleRule } from '@/backend';

export type ParsedCourse = Omit<Course, 'rawAdjust' | 'rawScheduleRules' | 'scheduleRules'> & CourseScheduleRule;

export function parseCourses(courses: Course[]): ParsedCourse[] {
  const parsedCourses = courses.flatMap(course =>
    course.scheduleRules.map(rule => {
      const { rawAdjust, rawScheduleRules, scheduleRules, ...rest } = course;

      return {
        ...rest,
        ...rule,
      };
    }),
  );

  return parsedCourses;
}
