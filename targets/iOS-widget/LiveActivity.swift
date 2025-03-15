//
//  LiveActivity.swift
//  fzuhelper
//
//  Created by 黄骁 on 2025/3/14.
//

import ActivityKit
import WidgetKit
import SwiftUI

// MARK: 定义 Live Activity 的属性和动态状态
struct NextCourseActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // 动态状态：下一节课的相关信息
        var courseName: String      // 课程名称
        var courseLocation: String  // 地点
        var courseWeekday: String   // 星期
        var courseSection: String   // 节数
    }

    // 固定属性：活动名称
    var name: String
}

// MARK: 定义 Live Activity 的实现
struct NextCourseLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: NextCourseActivityAttributes.self) { context in
            // 锁屏和横幅通知的 UI
            VStack(alignment: .leading) {
                Text("即将上课")
                    .font(.headline)
                    .foregroundColor(.white)
                Text(context.state.courseName)
                    .font(.title2)
                    .bold()
                    .foregroundColor(.white)
                Text("地点: \(context.state.courseLocation)")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
                Text("\(context.state.courseWeekday) \(context.state.courseSection)")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding()
            .activityBackgroundTint(Color.blue) // 设置背景颜色
            .activitySystemActionForegroundColor(Color.white) // 设置前景颜色

        } dynamicIsland: { context in
            DynamicIsland {
                // 展开状态的 UI
                DynamicIslandExpandedRegion(.center) {
                    VStack(alignment: .leading) {
                        Text("即将上课")
                            .font(.headline)
                            .foregroundColor(.white)
                        Text(context.state.courseName)
                            .font(.title3)
                            .bold()
                            .foregroundColor(.white)
                        Text("地点: \(context.state.courseLocation)")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                        Text("\(context.state.courseWeekday) \(context.state.courseSection)")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("上课前 1 小时提醒")
                        .font(.footnote)
                        .foregroundColor(.white.opacity(0.7))
                }
            } compactLeading: {
                Text("课")
                    .font(.headline)
                    .foregroundColor(.white)
            } compactTrailing: {
                Text(context.state.courseName.prefix(3)) // 只显示课程名称的前三个字符
                    .font(.headline)
                    .foregroundColor(.white)
            } minimal: {
                Text("课")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            .widgetURL(URL(string: "fzuhelper://next-course")) // 点击跳转到 App 的 URL Scheme
            .keylineTint(Color.blue)
        }
    }
}

// 启动 Live Activity 的逻辑
func startNextCourseLiveActivity(nextClass: ClassInfo, currentWeek: Int) {
    // 检查当前时间是否需要启动 Live Activity
    guard let startTime = calculateClassStartTime(nextClass: nextClass) else { return }
    let now = Date()
    let timeUntilStart = startTime.timeIntervalSince(now)

//    // 如果距离上课时间超过 1 小时或已经过了上课时间，则不启动
//    if timeUntilStart > 36000 || timeUntilStart < -3600 {
//        return
//    }

    // 定义 Live Activity 的属性和动态状态
    let attributes = NextCourseActivityAttributes(name: "下一节课提醒")
    let contentState = NextCourseActivityAttributes.ContentState(
        courseName: nextClass.courseBean.name,
        courseLocation: nextClass.courseBean.location,
        courseWeekday: "周\(getWeekChinese(nextClass.courseBean.weekday))",
        courseSection: "\(nextClass.courseBean.startClass)-\(nextClass.courseBean.endClass)节"
    )
  
    // 创建 ActivityContent，期望是课前 30 分钟和课后 60 分钟显示实时活动
    let content = ActivityContent(
        state: contentState,
        staleDate: Calendar.current
          .date(
            byAdding: .minute,
            value: 90,
            to: Date()
          ) // 设置过期时间为 1.5 小时
    )

    // 启动 Live Activity
    do {
        let activity = try Activity<NextCourseActivityAttributes>.request(
            attributes: attributes,
            content: content,
            pushType: .none
        )
        print("Live Activity 启动成功: \(activity.id)")
    } catch {
        print("Live Activity 启动失败: \(error)")
    }
}

// 计算课程的开始时间
func calculateClassStartTime(nextClass: ClassInfo) -> Date? {
    let calendar = Calendar.current
    let currentDate = Date()

    // 根据课程的周几和节次计算开始时间
    let weekday = nextClass.courseBean.weekday
    guard let startHour = getHourForSection(nextClass.courseBean.startClass) else {
        return nil
    }

    // 设置课程的开始日期和时间
    var components = calendar.dateComponents([.year, .month, .day], from: currentDate)
    components.weekday = weekday
    components.hour = startHour
    components.minute = 0

    return calendar.date(from: components)
}

// 根据节次获取对应的小时
func getHourForSection(_ section: Int) -> Int? {
    switch section {
    case 1: return 8
    case 2: return 9
    case 3: return 10
    case 4: return 11
    case 5: return 14
    case 6: return 15
    case 7: return 16
    case 8: return 17
    case 9: return 19
    case 10: return 20
    default: return nil
    }
}

// 示例：在 Widget 的 Timeline 中调用 Live Activity
func startLiveActivityIfNeeded(nextClass: ClassInfo?, startTime: TimeInterval?, currentWeek: Int) {
    guard let nextClass = nextClass, let startTime = startTime else { return }

    // 检查当前是否需要启动 Live Activity
    let now = Date().timeIntervalSince1970
    if startTime - now <= 36000 { // 距离上课时间小于等于 1 小时
        startNextCourseLiveActivity(nextClass: nextClass, currentWeek: currentWeek)
    }
}
