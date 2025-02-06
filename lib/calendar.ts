import { Course, SemesterList } from '@/api/backend';
import { CLASS_SCHEDULES, COURSE_LOCAL_CALENDAR_ID_KEY, COURSE_TERMS_LIST_KEY } from '@/lib/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { toast } from 'sonner-native';

const CalendarName = 'fzuhelper-course-calendar'; // only for Android

// 获取默认日历源
async function getDefaultCalendarSource(): Promise<Calendar.Source> {
  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar.source;
  } else {
    return { isLocalAccount: true, name: 'fzuhelper', type: 'local' };
  }
}

// 创建日历
async function createCalendar(): Promise<string> {
  const defaultCalendarSource = await getDefaultCalendarSource();

  const newCalendarID = await Calendar.createCalendarAsync({
    title: 'FZUHelper Calendar',
    color: '#007AFF',
    entityType: Calendar.EntityTypes.EVENT, // iOS
    sourceId: defaultCalendarSource.id, // iOS
    source: defaultCalendarSource,
    name: CalendarName, // Android
    ownerAccount: 'personal', // Android
    accessLevel: Calendar.CalendarAccessLevel.OWNER, // Android
  });

  return newCalendarID;
}

// 这个导出只能导出已经在 AsyncStorage 中的课程数据，这个函数需要在 try-catch 语句中调用
export async function exportCourseToNativeCalendar(courses: Course[], startDate: string) {
  try {
    // 请求日历权限
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('没有授予日历权限，请在设置中开启');
    }

    // 检查是否已经存在日历，这里分为两步，第一步是从本地 app 存储，第二步是从系统日历中查找
    let calendarID = await AsyncStorage.getItem(COURSE_LOCAL_CALENDAR_ID_KEY);
    if (!calendarID) {
      // 获取所有日历
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      // 查找同名日历
      const existingCalendar = calendars.find(calendar => calendar.title === CalendarName);

      if (existingCalendar) {
        // 如果找到同名日历，使用其 ID
        calendarID = existingCalendar.id;
      } else {
        // 如果未找到同名日历，则创建新的日历
        calendarID = await createCalendar();
      }

      // 将日历 ID 存储到本地
      await AsyncStorage.setItem(COURSE_LOCAL_CALENDAR_ID_KEY, calendarID);
    }

    // 从 AsyncStorage 中获取学期列表，里面包含了学期开始的时间，因为我们需要基于此去计算课程的开始时间
    // 再一步步解析到学期开始日期，这样就可以结合周数去计算课程的开始时间
    // const termsListRaw = await AsyncStorage.getItem(COURSE_TERMS_LIST_KEY);
    // if (!termsListRaw) {
    //   throw new Error('学期列表为空，请重新登录'); // 在触发这个函数时不可能没有缓存学期列表，这个错误应当永不可能发生
    // }
    // const termList = JSON.parse(termsListRaw) as SemesterList;
    // const selectdTerm = termList.find(t => t.term_id === term); // term_id e.g. 202401
    // if (!selectdTerm) {
    //   throw new Error(`未找到学期 ${term} 的相关信息，请检查学期 ID 是否正确`);
    // }
    const semesterStart = new Date(startDate);
    if (isNaN(semesterStart.getTime())) {
      throw new Error(`无法解析学期的开始时间`);
    }

    // 解析课程，遍历课程安排并添加到日历中
    for (const course of courses) {
      for (const rule of course.scheduleRules) {
        console.log('课程规则:', rule);
        const { location, startClass, endClass, startWeek, endWeek, weekday, single, double } = rule;

        // 根据学期开始时间计算课程的每周开始日期
        for (let week = startWeek; week <= endWeek; week++) {
          // 如果是单周课程，跳过双周
          if (single && week % 2 === 0) continue;
          // 如果是双周课程，跳过单周
          if (double && week % 2 !== 0) continue;

          // 计算课程的具体日期
          const eventDate = new Date(semesterStart);
          eventDate.setDate(eventDate.getDate() + (week - 1) * 7 + (weekday - 1)); // 根据周数和星期几计算日期

          // 假设每节课为 45 分钟，课程从早上 8:00 开始
          const [startTimeString, endTimeString] = [
            CLASS_SCHEDULES[startClass - 1][0],
            CLASS_SCHEDULES[endClass - 1][1],
          ];

          // 设置课程的开始时间
          const startTime = new Date(eventDate);
          const [startHour, startMinute] = startTimeString.split(':').map(Number);
          startTime.setHours(startHour, startMinute, 0, 0);

          // 设置课程的结束时间
          const endTime = new Date(eventDate);
          const [endHour, endMinute] = endTimeString.split(':').map(Number);
          endTime.setHours(endHour, endMinute, 0, 0);

          // 创建日历事件

          console.log('创建日历事件，详情:', {
            title: course.name,
            location: location || '无指定地点',
            startDate: startTime,
            endDate: endTime,
            timeZone: 'Asia/Shanghai', // 东八区
            notes: `教师: ${course.teacher}`,
          });

          await Calendar.createEventAsync(calendarID, {
            title: course.name,
            location: location || '无指定地点',
            startDate: startTime,
            endDate: endTime,
            timeZone: 'Asia/Shanghai', // 东八区
            notes: `教师: ${course.teacher}`,
          });
        }
      }
      // 待补充
    }
  } catch (error) {
    console.error(error);
  }
}

export async function deleteAllCreatedCalendars() {
  try {
    // 请求日历权限
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('没有授予日历权限，请在设置中开启');
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const fzuCalendars = calendars.filter(calendar => calendar.title === CalendarName);

    for (const calendar of fzuCalendars) {
      await Calendar.deleteCalendarAsync(calendar.id);
    }
    await AsyncStorage.removeItem(COURSE_LOCAL_CALENDAR_ID_KEY);
  } catch (error) {
    toast.error('删除日历失败(' + error + ')');
    console.error(error);
  }
}
