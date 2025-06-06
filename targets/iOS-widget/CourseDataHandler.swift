//
//  CourseDataHandler.swift
//  fzuhelper
//
//  Created by 黄骁(ozline) on 2025/3/8.
//
//  这个文件负责了处理课程数据，如果 App 侧发生了课程数据逻辑更改，直接改这里逻辑就可以了

import Foundation

// 数据模型：课程扩展类，请参考我们项目中的 ExtendCourse 类型，不要直接在这边改
// ExtendCourse 是课程的详细数据结构，用于描述单个课程的所有信息
// 这个课程信息是不完整的，因为我们不需要其余无用信息
struct ExtendCourse: Codable {
  let type: Int
  let name: String
  let location: String
  let startClass: Int
  let endClass: Int
  let startWeek: Int
  let endWeek: Int
  let weekday: Int
  let single: Bool
  let double: Bool
  let remark: String
}

// 数据模型：缓存课程数据，这个结构请参考 @/lib/course.ts 中 save 的数据结构，不要直接在这边改
// CacheCourseData 是整个课程数据的缓存结构，包括课程、考试、学期信息等
struct CacheCourseData: Codable {
  let courseData: [Int: [ExtendCourse]]?  // 课程数据：星期几 -> 课程列表
  let examData: [Int: [ExtendCourse]]?  // 考试数据：星期几 -> 考试列表
  let customData: [Int: [ExtendCourse]]? // 自定义课程
  let startDate: String  // 学期开始日期
  let maxWeek: Int  // 最大周次
  let lastCourseUpdateTime: String  // 课程数据上次更新时间
  let lastExamUpdateTime: String  // 考场数据上次更新时间
}

// 数据模型：课程信息
struct ClassInfo {
  let week: Int
  let courseBean: ExtendCourse
}

// 数据模型：课程时间
struct ClassTime {
  let weekday: Int // 星期几
  let section: Int // 第几节
}

// 工具函数：获取下一节课程
func getNextClass(_ cacheCourseData: CacheCourseData, startTime: TimeInterval)
  -> ClassInfo?
{

  let currentTime = Date().timeIntervalSince1970
  let week = getWeeks(startTime: startTime, endTime: currentTime)
  let classTime = getNextClassTime(startTime: startTime)

  return searchNextClassIterative(
    cacheCourseData: cacheCourseData, week: week, classTime: classTime)
}

// 工具函数：计算当前周次
func getWeeks(startTime: TimeInterval, endTime: TimeInterval) -> Int {
  let weeks = Int((endTime - startTime) / (7 * 24 * 60 * 60)) + 1
  return max(weeks, 1)
}

// 工具函数：获取下一节课时间
func getNextClassTime(startTime: TimeInterval) -> ClassTime {
  let currentDate = Date()
  let calendar = Calendar.current
  let hour = calendar.component(.hour, from: currentDate)
  _ = calendar.component(.minute, from: currentDate)
  var weekday = calendar.component(.weekday, from: currentDate)

  // 调整 weekday 为中国大陆习惯：周一 = 1，周日 = 7
  weekday = (weekday + 5) % 7 + 1

  let section: Int
  switch hour {
  case 0..<8: section = 1
  case 8..<9: section = 2
  case 9..<10: section = 3
  case 10..<11: section = 4
  case 11..<14: section = 5
  case 14..<15: section = 6
  case 15..<16: section = 7
  case 16..<17: section = 8
  case 17..<19: section = 9
  case 19..<20: section = 10
  default: section = 11
  }

  // 如果当前时间已经超过了本天的最后一节课，则需要跳到下一天
  if hour >= 20 {
    weekday = weekday % 7 + 1  // 跳到下一天
    return ClassTime(weekday: weekday, section: 1)  // 从第一节课开始
  }

  return ClassTime(weekday: weekday, section: section)
}

// 工具函数：迭代查找下一节课程
func searchNextClassIterative(
  cacheCourseData: CacheCourseData, week: Int, classTime: ClassTime
) -> ClassInfo? {
  var currentWeek = week
  var currentWeekday = classTime.weekday
  var currentSection = classTime.section

  // 聚合课程、考试和自定义课程，这样可以统一查询
  // 在课表上，这三个结构有些许区别，但是在小组件这边，统一都是 ExtendCourse 这个类型的
  let courseBeans =
    (cacheCourseData.courseData?.values.flatMap { $0 } ?? [])
  + (cacheCourseData.examData?.values.flatMap { $0 } ?? []) + (
    cacheCourseData.customData?.values.flatMap { $0 } ?? [])

  // 排序：按星期、开始节次排序
  let sortedCourses = courseBeans.sorted { (course1: ExtendCourse, course2: ExtendCourse) -> Bool in
    if course1.weekday != course2.weekday {
      // 按星期几升序排列
      return course1.weekday < course2.weekday
    } else if course1.startClass != course2.startClass {
      // 如果同一天上课，按开始节次升序排列
      return course1.startClass < course2.startClass
    } else {
      // 如果开始节次相同，可按其他规则排序（如课程名称，避免冲突）
      return course1.name < course2.name
    }
  }

  // 检查当前时间是否是星期天晚上最后一节课之后的，如果是的话直接切到下一周
  // 注意：currentWeekDay
  if currentWeekday == 6 && currentSection > 11 {
    currentWeek += 1
    currentWeekday = 1
    currentSection = 1
  }

  // 只有没超过学期末我们才继续查询
  while currentWeek <= cacheCourseData.maxWeek {
    // 遍历课程
    for course in sortedCourses {
      // 符合条件: 在开课周内，且当前遍历的节数符合起始课，且符合单双周规则
      if currentWeek >= course.startWeek && currentWeek <= course.endWeek
        && currentWeekday == course.weekday
        && currentSection == course.startClass
        && ((course.single && currentWeek % 2 == 1) || (course.double && currentWeek % 2 == 0))
      {
        return ClassInfo(week: currentWeek, courseBean: course)
      }
    }

    // 如果当天还能继续下一节，就到下一节
    // 否则判断是否在周内，在周内则直接跳到下一天的第一节
    // 如果不在周内，则跳到下一周的周一
    if currentSection < 11 {
      currentSection += 1
    } else if currentWeekday < 7 {
      currentWeekday += 1
      currentSection = 1
    } else {
      currentWeek += 1
      currentWeekday = 1
      currentSection = 1
    }
  }

  return nil
}

// 工具函数：获取星期的中文表示
func getWeekChinese(_ i: Int) -> String {
  let weekdays = ["一", "二", "三", "四", "五", "六", "日"]
  return weekdays[i - 1]
}
