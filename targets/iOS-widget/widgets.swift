//
//  CourseDataHandler.swift
//  fzuhelper
//
//  Created by 黄骁(ozline) on 2025/3/8.
//
//  小组件的样式渲染代码，适用于桌面 Widget

import SwiftUI
import WidgetKit

// TimelineProvider 负责生成小组件的内容
struct Provider: AppIntentTimelineProvider {
  // 加载时的占位内容
  func placeholder(in context: Context) -> CourseWidgetEntry {
    CourseWidgetEntry(date: Date(), snapshot: nil)
  }

  // 在用户添加 Widget 的时候显示的小组件信息
  func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> CourseWidgetEntry {
    entry(for: configuration)
  }

  // 渲染小组件显示的逻辑
  func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<CourseWidgetEntry> {
    let current = entry(for: configuration)
    let dates = current.snapshot?.timelineDates(from: current.date) ?? [current.date]
    let entries = dates.map { date in
      CourseWidgetEntry(
        date: date, snapshot: current.snapshot, message: current.message,
        showRemarks: current.showRemarks, previewTomorrow: current.previewTomorrow)
    }
    return Timeline(entries: entries, policy: current.snapshot == nil ? .never : .atEnd)
  }

  private func entry(for configuration: ConfigurationAppIntent) -> CourseWidgetEntry {
    let json = UserDefaults(suiteName: "group.FzuHelper.NextCourse")?.string(forKey: "course_current_cache") ?? ""
    var snapshot: CourseWidgetSnapshot?
    var message = "请打开福uu同步课表"
    if !json.isEmpty {
      do {
        let cache = try JSONDecoder().decode(CourseWidgetCache.self, from: Data(json.utf8))
        if cache.widgetSnapshot?.version == 2 {
          snapshot = cache.widgetSnapshot
        }
      } catch {
        // 数据异常，例如无法解码
        message = "课表数据异常，请重新同步"
      }
    }
    return CourseWidgetEntry(
      date: Date(), snapshot: snapshot, message: message,
      showRemarks: configuration.showRemarks, previewTomorrow: configuration.previewTomorrow)
  }
}

// 显示的数据
struct CourseWidgetEntry: TimelineEntry {
  let date: Date  // 日期
  let snapshot: CourseWidgetSnapshot?
  var message = "请打开福uu同步课表"
  var showRemarks = true
  var previewTomorrow = false
}

struct widgetEntryView: View {
  let entry: CourseWidgetEntry
  @Environment(\.widgetFamily) private var family  // 获取当前小组件的尺寸类型

  var body: some View {
    CourseWidgetView(entry: entry, family: family)
  }
}

struct CourseWidgetView: View {
  let entry: CourseWidgetEntry
  let family: WidgetFamily

  var body: some View {
    Group {
      if family == .accessoryRectangular {
        lockScreen
      } else {
        desktop
      }
    }
    .containerBackground(for: .widget) { Color("WidgetBackground") }
    .widgetURL(URL(string: "fzuhelper://"))
  }

  private var desktop: some View {
    Group {
      if let snapshot = entry.snapshot {
        HStack(alignment: .top, spacing: 10) {
          CourseDayView(
            day: family == .systemMedium
              ? snapshot.day(at: entry.date)
              : snapshot.smallDay(at: entry.date, previewTomorrow: entry.previewTomorrow),
            snapshot: snapshot, showRemarks: entry.showRemarks, showWeekday: true)
          if family == .systemMedium {
            CourseDayView(
              day: snapshot.day(at: entry.date, tomorrow: true),
              snapshot: snapshot, showRemarks: entry.showRemarks, showWeekday: false)
          }
        }
      } else {
        Text(entry.message)
          .font(.caption)
          .foregroundStyle(Color("WidgetSecondary"))
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
    }
    .padding(18)
    .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
  }

  // 锁屏组件简化显示内容
  private var lockScreen: some View {
    VStack(alignment: .leading, spacing: 2) {
      if let snapshot = entry.snapshot {
        let day = snapshot.smallDay(at: entry.date, previewTomorrow: entry.previewTomorrow)
        if let course = day.events.first {
          Text(course.name).font(.headline).lineLimit(1)
          Text(course.location).font(.caption).lineLimit(1)
          Text("\(day.isTomorrow ? "明日 " : "")\(course.timeText)").font(.caption).lineLimit(1)
        } else {
          Text(day.emptyText).font(.headline)
        }
      } else {
        Text(entry.message).font(.caption)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

struct CourseDayView: View {
  let day: CourseWidgetDay
  let snapshot: CourseWidgetSnapshot
  let showRemarks: Bool
  let showWeekday: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(spacing: 4) {
        WidgetText(day.isTomorrow ? "明日课程" : snapshot.formatted(day.date, "MM月dd日"), size: 12)
          .foregroundStyle(Color(day.isTomorrow ? "WidgetTomorrow" : "WidgetHeading"))
        if showWeekday {
          WidgetText(snapshot.formatted(day.date, "EEE"), size: 12)
            .foregroundStyle(Color("WidgetBlue"))
        }
      }
      .minimumScaleFactor(0.7)
      .widgetAccentable()

      if day.events.isEmpty {
        WidgetText(day.emptyText, size: 10)
          .foregroundStyle(Color("WidgetSecondary"))
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      } else {
        // 日期、课名、教室和时间优先保留，当前课程的备注优先于后续课程。
        // 依次隐藏剩余提示、后续课程，再将备注从 3 行减至 2、1、0 行。
        // 仍放不下才把课名从 2 行减为 1 行；使用省略号，保留系统字号。
        ViewThatFits(in: .vertical) {
          if day.isTomorrow {
            ForEach((1...day.events.count).reversed(), id: \.self) { count in
              courses(count: count, showRemaining: false)
            }
          } else {
            if day.events.count > 2 { courses(count: 2, showRemaining: true) }
            if day.events.count > 1 {
              courses(count: 2, showRemaining: false)
            }
            courses(count: 1, showRemaining: false)
            if showRemarks && !day.events[0].remark.isEmpty {
              ForEach((0...2).reversed(), id: \.self) { lines in
                courses(count: 1, showRemaining: false, remarkLines: lines)
              }
            }
            courses(count: 1, showRemaining: false, remarkLines: 0, nameLines: 1)
          }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .clipped()
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }

  private func courses(count: Int, showRemaining: Bool, remarkLines: Int = 3, nameLines: Int = 2) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      ForEach(0..<count, id: \.self) { index in
        CourseEventView(
          course: day.events[index], compact: day.isTomorrow || index > 0,
          showRemarks: showRemarks, remarkLines: remarkLines, nameLines: nameLines)
      }
      if showRemaining {
        RemainingCoursesView(count: day.events.count - count)
      }
    }
    .fixedSize(horizontal: false, vertical: true)
  }
}

struct CourseEventView: View {
  let course: WidgetCourseEvent
  let compact: Bool
  let showRemarks: Bool
  var remarkLines = 3
  var nameLines = 2

  var body: some View {
    HStack(spacing: 4) {
      RoundedRectangle(cornerRadius: 2)
        .fill(Color(compact ? "WidgetLightBlue" : "WidgetBlue"))
        .frame(width: 2)
      VStack(alignment: .leading, spacing: compact ? 4 : 6) {
        WidgetText(course.name, size: compact ? 10 : 14, lines: compact ? 1 : nameLines)
          .foregroundStyle(Color(compact ? "WidgetHeading" : "WidgetTitle"))
        if compact {
          // 同排放不下时将时间移到下一行，避免时间挤压教室。
          ViewThatFits(in: .horizontal) {
            HStack(spacing: 2) {
              WidgetText(course.location, size: 10)
              WidgetText(course.timeText, size: 10)
            }
            VStack(alignment: .leading, spacing: 2) {
              WidgetText(course.location, size: 10)
              WidgetText(course.timeText, size: 10)
            }
          }
          .foregroundStyle(Color("WidgetSecondary"))
        } else {
          VStack(alignment: .leading, spacing: 4) {
            if showRemarks && remarkLines > 0 && !course.remark.isEmpty {
              WidgetText(course.remark, size: 10, lines: remarkLines)
                .foregroundStyle(Color("WidgetSecondary"))
            }
            WidgetText(course.location, size: 12)
            WidgetText(course.timeText, size: 12).minimumScaleFactor(0.7)
          }
          .foregroundStyle(Color("WidgetDetail"))
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(.vertical, 3)
      .padding(.trailing, 2)
    }
    .fixedSize(horizontal: false, vertical: true)
    .accessibilityElement(children: .combine)
  }
}

struct RemainingCoursesView: View {
  let count: Int

  var body: some View {
    HStack(spacing: 4) {
      HStack(alignment: .center, spacing: 2) {
        ForEach(0..<min(count, 3), id: \.self) { index in
          RoundedRectangle(cornerRadius: 2)
            .fill(Color(["WidgetLightBlue", "WidgetFaintBlue", "WidgetGray"][index]))
            .frame(width: 2, height: CGFloat(15 - index * 2))
        }
      }
      WidgetText("其他 \(count) 节课", size: 10)
        .foregroundStyle(Color("WidgetSecondary"))
    }
  }
}

struct WidgetText: View {
  let text: String
  let lines: Int
  @ScaledMetric private var size: CGFloat

  init(_ text: String, size: CGFloat, lines: Int = 1) {
    self.text = text
    self.lines = lines
    _size = ScaledMetric(wrappedValue: size, relativeTo: .body)
  }

  var body: some View {
    let font = UIFont.systemFont(ofSize: size, weight: .semibold)
    Text(text)
      .font(.system(size: size, weight: .semibold))
      .lineLimit(lines)
      .lineSpacing(size * 1.1 - font.lineHeight)
      .padding(.vertical, -(font.lineHeight - font.capHeight) / 2)
  }
}

struct widget: Widget {
  let kind = "widget"

  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
      widgetEntryView(entry: entry)
    }
    .configurationDisplayName("课程小组件")
    .description("查看当前课程、剩余课程和明日课表")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    // 禁用自动添加的边距，和我们设定的背景色不一致
    // https://developer.apple.com/forums/thread/731423?answerId=758108022#758108022
    .contentMarginsDisabled()
  }
}
