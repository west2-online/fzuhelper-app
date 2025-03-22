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
  typealias Entry = SimpleEntry
  typealias Intent = ConfigurationAppIntent

  private let suiteNameKey = "group.FzuHelper.NextCourse"
  private let dataKey = "course_current_cache"

  // Loading 样式，理论上不会触发
  func placeholder(in context: Context) -> SimpleEntry {
    SimpleEntry(
      date: Date(), courseName: "加载中...", courseLocation: "未知",
      courseWeekday: "未知", courseSection: "未知", courseRemark: "",
      courseWeek: -1, showUpdateTime: false, notCurrentWeek: false)
  }

  // 在用户添加 Widget 的时候显示的模板样例小组件信息
  func snapshot(for configuration: ConfigurationAppIntent, in context: Context)
    async -> SimpleEntry
  {
    SimpleEntry(
      date: Date(), courseName: "样例课程", courseLocation: "教室A",
      courseWeekday: "周一", courseSection: "1-2节", courseRemark: "备注信息",
      courseWeek: -1, showUpdateTime: configuration.showLastUpdateTime,
      notCurrentWeek: false)
  }

  // 渲染小组件显示的逻辑
  func timeline(for configuration: ConfigurationAppIntent, in context: Context)
    async -> Timeline<SimpleEntry>
  {
    var entries: [SimpleEntry] = []

    let defaults = UserDefaults(suiteName: suiteNameKey)
    let jsonData = defaults?.string(forKey: dataKey) ?? ""

    var nextClass: ClassInfo? = nil
    var cacheCourseData: CacheCourseData?
    var startTime: TimeInterval?

    if jsonData.isEmpty {
      // 空数据
      let entryDate = Date()
      let entry = SimpleEntry(
        date: entryDate,
        courseName: "数据为空",
        courseLocation: "本地没有数据",
        courseWeekday: "",
        courseSection: "",
        courseRemark: "在课表设置刷新",
        courseWeek: -1,
        showUpdateTime: configuration.showLastUpdateTime,
        notCurrentWeek: false
      )
      entries.append(entry)
      return Timeline(entries: entries, policy: .atEnd)
    }

    do {
      if let data = jsonData.data(using: .utf8) {
        cacheCourseData = try JSONDecoder().decode(
          CacheCourseData.self, from: data)

        // 当前时间和学期开始时间
        let sdf = DateFormatter()
        sdf.dateFormat = "yyyy-MM-dd"
        startTime =
          sdf.date(from: cacheCourseData?.startDate ?? "")?
          .timeIntervalSince1970
        
//        print(startTime ?? "not work")
//        print(sdf.string(from: Date()))

        nextClass = getNextClass(cacheCourseData!, startTime: startTime ?? 0.00)

        let lastCourseUpdateTime = cacheCourseData!.lastCourseUpdateTime
        let lastExamUpdateTime = cacheCourseData!.lastExamUpdateTime
        defaults?.set(lastCourseUpdateTime, forKey: "lastCourseUpdateTime")
        defaults?.set(lastExamUpdateTime, forKey: "lastExamUpdateTime")
      }
    } catch {
      print("解码失败: \(error)")
      let entryDate = Date()
      // 数据异常，例如无法解码
      let entry = SimpleEntry(
        date: entryDate,
        courseName: "数据异常",
        courseLocation: "无法正常显示",
        courseWeekday: "",
        courseSection: "",
        courseRemark: "",
        courseWeek: -1,
        showUpdateTime: configuration.showLastUpdateTime,
        notCurrentWeek: false
      )
      entries.append(entry)
      return Timeline(entries: entries, policy: .atEnd)
    }

    if let nextClass = nextClass {
      // 数据正常，且有下一节课
      let currentDate = Date()
      let currentWeek = getWeeks(
        startTime: startTime ?? 0.00, endTime: currentDate.timeIntervalSince1970
      )
      let entryDate = currentDate
      let entry = SimpleEntry(
        date: entryDate,
        courseName: nextClass.courseBean.name,
        courseLocation: nextClass.courseBean.location,
        courseWeekday: "周\(getWeekChinese(nextClass.courseBean.weekday))",
        courseSection:
          "\(nextClass.courseBean.startClass)-\(nextClass.courseBean.endClass)节",
        courseRemark: nextClass.courseBean.remark,
        courseWeek: nextClass.week,
        showUpdateTime: configuration.showLastUpdateTime,
        notCurrentWeek: nextClass.week != currentWeek
      )
      entries.append(entry)
    } else {
      // 数据正常，且没有下一节课，那么就是放假了
      let entryDate = Date()
      let entry = SimpleEntry(
        date: entryDate,
        courseName: "放假啦",
        courseLocation: "",
        courseWeekday: "",
        courseSection: "",
        courseRemark: "",
        courseWeek: 0,
        showUpdateTime: configuration.showLastUpdateTime,
        notCurrentWeek: false
      )
      entries.append(entry)
    }

    return Timeline(entries: entries, policy: .atEnd)
  }
}

// 显示的数据
struct SimpleEntry: TimelineEntry {
  let date: Date  // 日期
  let courseName: String  // 课程名
  let courseLocation: String  // 上课地点
  let courseWeekday: String  // 周几
  let courseSection: String  // 第几节
  let courseRemark: String  // 备注
  let courseWeek: Int  // 第几周的课
  let showUpdateTime: Bool  // 是否显示刷新时间
  let notCurrentWeek: Bool  // 是否非本周课程
}

struct widgetEntryView: View {
  var entry: Provider.Entry
  @Environment(\.colorScheme) var colorScheme
  @Environment(\.widgetFamily) var widgetFamily  // 获取当前小组件的尺寸类型

  var body: some View {
    let backgroundColor: Color = colorScheme == .dark ? .black : .white
    let textColor: Color = colorScheme == .dark ? .white : .black
    let secondaryTextColor = textColor.opacity(0.7)

    ZStack {
      if widgetFamily == .accessoryRectangular {
        // 简化显示内容
        VStack(alignment: .leading, spacing: 2) {
          // 课程名称
          Text(entry.courseName)
            .font(.headline)
            .foregroundColor(textColor)
            .lineLimit(1)  // 限制为 1 行
            .truncationMode(.tail)

          // 教室和时间信息
          HStack {
            Text(entry.courseLocation)
              .font(.caption)
              .foregroundColor(secondaryTextColor)
              .lineLimit(1)
              .truncationMode(.tail)

            Spacer() // 空间分隔符，推送内容到左右两端

            // 周几，第几周
            Text("\(entry.courseWeekday)")
              .font(.caption)
              .foregroundColor(secondaryTextColor)
              .lineLimit(1)
            
            if entry.courseWeek > 0 {
              HStack {
                Text(
                  (entry.notCurrentWeek ? "(非本周)" : "第 \(entry.courseWeek) 周")
                )
                .font(.caption)
                .foregroundColor(secondaryTextColor)
                .lineLimit(1)
              }
            }
          }
          // 时间信息
          HStack {
            Text("更新于" + entry.date.formattedTimeOnly())
                .font(.caption)
                .foregroundColor(secondaryTextColor)
                .lineLimit(1)
            
            Spacer() // 空间分隔符，推送内容到左右两端
            
            // 周几
            Text("\(entry.courseSection)")
              .font(.caption)
              .foregroundColor(secondaryTextColor)
              .lineLimit(1)
          }
        }
        .padding(.horizontal, 4)  // 调整内边距
      } else {
        backgroundColor.ignoresSafeArea()
        VStack(alignment: .leading, spacing: 8) {
          // 课程名称
          Text(entry.courseName)
            .font(.headline)
            .foregroundColor(textColor)
            .lineLimit(2)  // 限制最多显示 2 行
            .truncationMode(
              .tail
            )  // 当内容超出 2 行时，尾部显示省略号
            .multilineTextAlignment(.leading)  // 多行时左对齐
            .frame(maxWidth: .infinity, alignment: .leading)  // 确保宽度自适应，左对齐
            .fixedSize(horizontal: false, vertical: true)  // 允许垂直方向的内容自适应

          // 周次信息
          if entry.courseWeek > 0 {
            HStack {
              Text(
                "第 \(entry.courseWeek) 周" + (entry.notCurrentWeek ? "(非本周)" : "")
              )
              .font(entry.notCurrentWeek ? .caption : .subheadline)
              .foregroundColor(secondaryTextColor)
              .lineLimit(1)
            }
          }

          // 课程地点
          Text(entry.courseLocation)
            .font(.subheadline)
            .foregroundColor(secondaryTextColor)
            .lineLimit(1)

          // 课程时间信息
          HStack {
            Text(entry.courseWeekday)
            Text(entry.courseSection)
          }
          .font(.subheadline)
          .foregroundColor(secondaryTextColor)

          // 备注信息
          if !entry.courseRemark.isEmpty {
            Text(entry.courseRemark)
              .font(.footnote)
              .foregroundColor(secondaryTextColor)
              .lineLimit(1)
          }

          // 更新时间信息
          if entry.showUpdateTime {
              Text(entry.date.formattedTimeOnly())
                  .font(.caption)
                  .foregroundColor(secondaryTextColor)
                  .lineLimit(1)
          }
        }
        .padding()
      }
    }
    .widgetBackground(backgroundColor)
  }
}

struct widget: Widget {
  let kind: String = "widget"

  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()
    ) { entry in
      widgetEntryView(entry: entry)
    }
    .configurationDisplayName("下一节课上什么")
    .description("显示下一节课程的详细信息")
    .supportedFamilies(
      [.systemSmall, .systemMedium, .accessoryRectangular]
    )  // 只支持小和中
  }
}

#Preview(as: .systemSmall) {
  widget()
} timeline: {
  SimpleEntry(
    date: Date(), courseName: "预览课程", courseLocation: "教室B",
    courseWeekday: "周二", courseSection: "3-4节", courseRemark: "无备注",
    courseWeek: -1, showUpdateTime: true, notCurrentWeek: false)
  SimpleEntry(
    date: Date(), courseName: "测试课程超级长长长长长长长的时候", courseLocation: "西20-2003",
    courseWeekday: "周二", courseSection: "3-4节", courseRemark: "无备注",
    courseWeek: -1, showUpdateTime: true, notCurrentWeek: false)
  SimpleEntry(
    date: Date(), courseName: "测试课程超级长长长长长长长的时候", courseLocation: "教室也超级长长长长长",
    courseWeekday: "周二", courseSection: "3-4节", courseRemark: "备注也超级长长长长长长",
    courseWeek: -1, showUpdateTime: true, notCurrentWeek: false)
}

// 一个自定义的 SwiftUI 扩展，用于为小组件 (Widget) 设置背景颜色或背景视图。它通过检查系统的 iOS 版本来为小组件提供不同的背景实现方式
extension View {
  func widgetBackground(_ backgroundView: some View) -> some View {
    // 实际上完全不必要，因为小组件需要 iOS18 的支持
    if #available(iOSApplicationExtension 17.0, *) {
      return containerBackground(for: .widget) {
        backgroundView
      }
    } else {
      return background(backgroundView)
    }
  }
}


// 添加格式化日期的拓展
extension Date {
    func formattedTimeOnly() -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "HH:mm" // 自定义日期格式，不包含年月日
        return dateFormatter.string(from: self)
    }
}
