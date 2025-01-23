import ExpoModulesCore
import UserNotifications
import UIKit

// 用于统一返回数据格式
struct ResponseMapper: Record {
  // tag 集合 是一个字符串数组，默认为空
  @Field var data = [String]()
  // 剩余可用的 tag 数
  @Field var remain = 0
  // 错误信息
  @Field var error = ""
}

public class ExpoUmengModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoUmeng")

        // 初始化友盟推送
        Function("initUmeng") { () -> Void in
          PushNotificationManager.shared.setAllowPrivacy()
          // 在 Manager 中，允许隐私政策后会自动初始化推送
          // 这个设置会写入 iOS 原生存储 UserDefaults 中
          // 下次开 app 时，会在 AppDelegate 中标准的初始化入口自动调用初始化推送
          // 既合规（要允许隐私政策才能初始化）也符合生命周期原则
        }

        // 检查通知权限
        Function("hasPermission") { () -> Bool in
            var hasPermission = false
            let semaphore = DispatchSemaphore(value: 0)

            UNUserNotificationCenter.current().getNotificationSettings { settings in
                hasPermission = settings.authorizationStatus == .authorized
                semaphore.signal()
            }

            _ = semaphore.wait(timeout: .now() + 5) // 等待权限检查
            return hasPermission
        }

        // 请求通知权限，待删除
        Function("requirePermission") { () -> Void in
          // iOS 不需要这个接口，现在是打开 App 时就会请求通知权限
        }

        // 返回设备的 deviceToken
        Function("getDeviceToken") { () -> String in
            return PushNotificationManager.shared.getDeviceToken()
        }

        // 返回设备的远程推送注册状态
        Function("isRegisteredForRemoteNotifications") { () -> Bool in
            return PushNotificationManager.shared.isRegisteredForRemoteNotifications()
        }

        // 返回错误信息
        Function("getError") { () -> String in
            return PushNotificationManager.shared.getError()
        }

        // 获取 AppKey 以及 Channel
        Function("getAppKeyAndChannel") { () -> String in
          guard let infoDictionary = Bundle.main.infoDictionary else {
              return "没有找到 Info.plist"
          }
          let appKey = infoDictionary["UMENG_APPKEY"] as? String ?? ""
          let channel = infoDictionary["UMENG_CHANNEL"] as? String ?? ""
          return "\(appKey), \(channel)"
        }

        // 获取所有 tag
        Function("getAllTags") { () -> ResponseMapper in
            var resp = ResponseMapper(data: [], remain: 0, error: "")
            let semaphore = DispatchSemaphore(value: 0) // 使用 DispatchSemaphore 来同步等待异步操作完成
            UMPushSwift.getTags { tags, remain, error in
                // 将 tags 转换为 Swift 的 Set<String>，然后再转换为 [String]
                if let tags = tags as? Set<String> {
                    resp.data = Array(tags)
                } else if let tags = tags as? NSSet {
                    resp.data = tags.allObjects as? [String] ?? []
                } else {
                    resp.data = []
                }
                resp.remain = remain
                resp.error = error?.localizedDescription ?? ""

                semaphore.signal()
            }
            semaphore.wait() // 等待异步操作完成
            return resp
        }

        // 添加 tag
        Function("addTags") { (tag: [String]) in
            var resp = ResponseMapper(data: [], remain: 0, error: "")
            let semaphore = DispatchSemaphore(value: 0) // 使用 DispatchSemaphore 来同步等待异步操作完成
            UMPushSwift.addTags(tag) { tags, remain, error in
                // 将 tags 转换为 Swift 的 Set<String>，然后再转换为 [String]
                if let tags = tags as? Set<String> {
                    resp.data = Array(tags)
                } else if let tags = tags as? NSSet {
                    resp.data = tags.allObjects as? [String] ?? []
                } else {
                    resp.data = []
                }
                resp.remain = remain
                resp.error = error?.localizedDescription ?? ""
                semaphore.signal()
            }
            semaphore.wait() // 等待异步操作完成
        }

        // 删除 tag
        Function("deleteTags") { (tag: [String]) in
            var resp = ResponseMapper(data: [], remain: 0, error: "")
            let semaphore = DispatchSemaphore(value: 0) // 使用 DispatchSemaphore 来同步等待异步操作完成
            UMPushSwift.deleteTags(tag) { tags, remain, error in
                // 将 tags 转换为 Swift 的 Set<String>，然后再转换为 [String]
                if let tags = tags as? Set<String> {
                    resp.data = Array(tags)
                } else if let tags = tags as? NSSet {
                    resp.data = tags.allObjects as? [String] ?? []
                } else {
                    resp.data = []
                }
                resp.remain = remain
                resp.error = error?.localizedDescription ?? ""
                semaphore.signal()
            }
            semaphore.wait() // 等待异步操作完成
        }
    }
}
