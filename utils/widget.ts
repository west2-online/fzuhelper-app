import AsyncStorage from '@react-native-async-storage/async-storage';

import { COURSE_DATA_KEY, COURSE_TERMS_LIST_KEY, COURSE_SETTINGS_KEY } from '@/lib/constants';
import { getWeeksBySemester, parseCourses, readCourseSetting } from '@/utils/course';

export async function sendWidgetDate(): Promise<ClassInfo | null> {
  const selectedSemester = JSON.parse(await AsyncStorage.getItem(COURSE_SETTINGS_KEY) || '{}').selectedSemester;
  const courseTermsList = JSON.parse(await AsyncStorage.getItem(COURSE_TERMS_LIST_KEY) || '{}').data?.data;

  if (!courseTermsList) return;
  if (!selectedSemester  || selectedSemester == "") {
    selectedSemester = courseTermsList.current_term;
    };

  const courseData = JSON.parse(await AsyncStorage.getItem(`${COURSE_DATA_KEY}__${selectedSemester}`)).data?.data;
  if (!courseData) return;

  const jsonArray = courseTermsList.terms;
  let startDate: number = 0;
  let endDate: number = 0;
  let endWeek: number = 0;

  for (let i = 0; i < jsonArray.length; i++) {
      const item = jsonArray[i];
      if (item.term === selectedSemester) {
          startDate = Date.parse(item.start_date);  // Converting to seconds
          endDate = Date.parse(item.end_date);      // Converting to seconds
          endWeek = getWeeks(startDate, endDate);
          break;
    }
  }

    const week = getWeeks(startDate, Math.floor(Date.now())); // Current time in seconds
    const classTime = getNextClassTime(startDate);

    return searchNextClassIterative(week, classTime, courseData, endWeek);
}

function getNextClassTime(startTime: number): ClassTime {
  // 当还未开学时，设置当前为周一第1节
  if (startTime > Math.floor(Date.now())) {
    return { weekday: 1, time: 1 };
  }

  const d = new Date();
  const hour = d.getHours();
  const minute = d.getMinutes();

  const weekday = (d.getDay() + 6) % 7 + 1; // JavaScript 中的 getDay 返回值是 0-6, 转换成 1-7

  let time: number;

  if (hour < 8 || (hour === 8 && minute < 20)) {
    time = 1;
  } else if (hour < 9 || (hour === 9 && minute < 15)) {
    time = 2;
  } else if (hour < 10 || (hour === 10 && minute < 20)) {
    time = 3;
  } else if (hour < 11 || (hour === 11 && minute < 15)) {
    time = 4;
  } else if (hour < 14) {
    time = 5;
  } else if (hour === 14 && minute < 55) {
    time = 6;
  } else if (hour < 15 || (hour === 15 && minute < 50)) {
    time = 7;
  } else if (hour < 16 || (hour === 16 && minute < 45)) {
    time = 8;
  } else if (hour < 17 || hour < 19) {
    time = 9;
  } else if (hour === 19 && minute < 55) {
    time = 10;
  } else if (hour < 20 || (hour === 20 && minute < 50)) {
    time = 11;
  } else {
    time = 12;
  }

  return { weekday, time };
}

function getWeekChinese(i: number): string {
    switch (i) {
        case 0: return "日";
        case 1: return "一";
        case 2: return "二";
        case 3: return "三";
        case 4: return "四";
        case 5: return "五";
        case 6: return "六";
        case 7: return "日";
        default: return "无";
    }
}

function getWeeks(startTime: number, endTime: number): number {
    if (endTime < startTime) {
        return 1;
    }
    const res = Math.floor((endTime - startTime) / (7 * 24 * 60 * 60 * 1000) + 1); // 1000 为毫秒换算
    return res <= 0 ? 1 : res;
}

function searchNextClassIterative(
    week: number,
    classTime: ClassTime,
    coursesData: any[],
    endWeek: number
): ClassInfo | null {
    let currentWeek = week;
    let currentWeekday = classTime.weekday;
    let currentSection = classTime.section;

    while (currentWeek <= endWeek) {
        let foundExam: CourseBean | null = null;
        let foundCustom: CourseBean | null = null;
        let foundOrdinary: CourseBean | null = null;

        for (let i = 0; i < coursesData.length; i++) {
            const rawCourse = coursesData[i];
            const courseDetailList = rawCourse.scheduleRules;

            for (let j = 0; j < courseDetailList.length; j++) {
                const courseDetail = courseDetailList[j];

                if (
                    currentWeek >= courseDetail.startWeek &&
                    currentWeek <= courseDetail.endWeek &&
                    (
                        (courseDetail.single && currentWeek % 2 === 1) ||
                        (courseDetail.double && currentWeek % 2 === 0)
                    ) &&
                    currentWeekday === courseDetail.weekday &&
                    currentSection === courseDetail.startClass
                ) {
                    const course: CourseBean = {
                        kcName: rawCourse.name,
                        kcLocation: courseDetail.location,
                        kcStartTime: courseDetail.startClass,
                        kcEndTime: courseDetail.endClass,
                        kcWeekend: courseDetail.weekday,
                        kcNote: rawCourse.remark,
                        type: rawCourse.type // Assuming `type` is directly available here
                    };

                    switch (course.type) {
                        case 1:
                            foundExam = course;
                            break;
                        case 0:
                            foundCustom = course;
                            break;
                        default:
                            foundOrdinary = course;
                            break;
                    }
                }
            }
        }

        // 优先级：考试 > 自定义课程 > 教务处导入课程
        if (foundExam) {
            return { week: currentWeek, courseBean: foundExam };
        } else if (foundCustom) {
            return { week: currentWeek, courseBean: foundCustom };
        } else if (foundOrdinary) {
            return { week: currentWeek, courseBean: foundOrdinary };
        }

        // Move to the next section, day or week
        if (currentSection < 11) {
            currentSection++;
        } else if (currentWeekday < 7) {
            currentWeekday++;
            currentSection = 1;
        } else {
            currentWeek++;
            currentWeekday = 1;
            currentSection = 1;
        }
    }

    return null;
}


interface CourseBean {
    kcName: string;
    kcLocation: string;
    kcStartTime: number;
    kcEndTime: number;
    kcWeekend: number;
    kcNote: string;
    type: number;
}

interface ClassInfo {
    week: number;
    courseBean: CourseBean;
}

interface ClassTime {
  weekday: number;
  time: number;
}
