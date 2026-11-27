//
//  CourseDataHandler.swift
//  fzuhelper
//
//  Created by 黄骁(ozline) on 2025/3/8.
//
//  这个文件负责处理小组件课程数据，数据协议需与 lib/course-widget.ts 保持一致

import Foundation

// 数据模型：单次课程信息，请参考 App 侧的 WidgetCourseEvent 类型，不要单独修改字段
struct WidgetCourseEvent: Codable {
  let date: String
  let name: String
  let location: String
  let remark: String
  let startMinute: Int
  let endMinute: Int

  var timeText: String {
    String(format: "%02d:%02d-%02d:%02d", startMinute / 60, startMinute % 60, endMinute / 60, endMinute % 60)
  }
}

// 数据模型：当天课程信息
struct CourseWidgetDay {
  let date: Date
  let isTomorrow: Bool
  let events: [WidgetCourseEvent]
  let emptyText: String
}

// 数据模型：课表快照，包括课程和学期信息，与 lib/course-widget.ts 保持一致
struct CourseWidgetSnapshot: Codable {
  let version: Int
  let timeZone: String
  let startDate: String  // 学期开始日期
  let endDate: String  // 学期结束日期
  let events: [WidgetCourseEvent]

  var calendar: Calendar {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone(identifier: timeZone)!
    return calendar
  }

  func formatted(_ date: Date, _ format: String) -> String {
    let formatter = DateFormatter()
    formatter.calendar = calendar
    formatter.timeZone = calendar.timeZone
    formatter.locale = Locale(identifier: "zh_CN")
    formatter.dateFormat = format
    return formatter.string(from: date)
  }

  func day(at now: Date, tomorrow: Bool = false) -> CourseWidgetDay {
    let date = calendar.date(byAdding: .day, value: tomorrow ? 1 : 0, to: now)!
    let key = formatted(date, "yyyy-MM-dd")
    let minute = calendar.component(.hour, from: now) * 60 + calendar.component(.minute, from: now)
    let courses = events.filter { $0.date == key }
    let remaining = courses.filter { tomorrow || $0.endMinute > minute }
    let emptyText: String
    if key < startDate {
      emptyText = "尚未开学"
    } else if key > endDate {
      emptyText = "本学期已结束"
    } else if tomorrow {
      emptyText = "明日没有课程"
    } else {
      emptyText = courses.isEmpty ? "今日没有课程" : "今日课程已结束"
    }
    return CourseWidgetDay(date: date, isTomorrow: tomorrow, events: remaining, emptyText: emptyText)
  }

  func smallDay(at now: Date, previewTomorrow: Bool) -> CourseWidgetDay {
    let today = day(at: now)
    let minute = calendar.component(.hour, from: now) * 60 + calendar.component(.minute, from: now)
    // 今日仍有未结束的课程或考试时，优先保留今日。
    let showTomorrow = today.events.isEmpty && (previewTomorrow || minute >= 21 * 60 + 35)
    return showTomorrow ? day(at: now, tomorrow: true) : today
  }

  // 提前保存状态变化，App 未运行时也能切换课程和日期。
  func timelineDates(from now: Date) -> [Date] {
    let start = calendar.startOfDay(for: now)
    let end = calendar.date(byAdding: .day, value: 3, to: start)!
    var dates: Set<Date> = [now, end]
    for offset in 0..<3 {
      let date = calendar.date(byAdding: .day, value: offset, to: start)!
      dates.insert(date)
      dates.insert(calendar.date(byAdding: .minute, value: 21 * 60 + 35, to: date)!)
      let key = formatted(date, "yyyy-MM-dd")
      for course in events where course.date == key {
        dates.insert(calendar.date(byAdding: .minute, value: course.endMinute, to: date)!)
      }
    }
    return dates.filter { $0 >= now }.sorted()
  }
}

// 数据模型：缓存课程数据，请参考 @/lib/course.ts 中 save 的数据结构，不要直接在这边改
struct CourseWidgetCache: Decodable {
  let widgetSnapshot: CourseWidgetSnapshot?
}
