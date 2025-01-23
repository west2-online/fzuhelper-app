import UserNotifications

// 定义一个类来管理推送通知的相关操作
public class PushNotificationManager {
    private var deviceToken: String = "" // 存储 deviceToken
    private var isRegistered: Bool = false // 存储设备远程推送注册状态
    private var error: String = "" // 存储错误信息
    private var isPushInitialized: Bool = false // 是否已经初始化过推送
    private let notificationDelegate = UmengNotificationDelegate() // 创建一个 UmengNotificationDelegate 实例

    // 单例模式（可选，方便全局访问）
    public static let shared = PushNotificationManager()

    // 初始化友盟推送的逻辑
    public func initializeUmengPush(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
        if self.isPushInitialized {
            return // 防止重复初始化
        }

        guard let infoDictionary = Bundle.main.infoDictionary else {
            print("ExpoUmeng: Info.plist not found")
            return
        }

        // 从 Info.plist 中读取友盟配置
        let appKey = infoDictionary["UMENG_APPKEY"] as? String ?? ""
        let channel = infoDictionary["UMENG_CHANNEL"] as? String ?? ""

        // 初始化友盟配置
        UMCommonSwift.initWithAppkey(appKey: appKey, channel: channel)

        // Push 组件基本功能配置
        let entity = UMessageRegisterEntity()
        // type 是对推送的几个参数的选择，可以选择一个或者多个。默认是三个全部打开，即：声音，弹窗，角标
        entity.types = Int(UMessageAuthorizationOptions.alert.rawValue |
                    UMessageAuthorizationOptions.badge.rawValue |
                    UMessageAuthorizationOptions.sound.rawValue)
        // 设置 UNUserNotificationCenter 的代理
        UNUserNotificationCenter.current().delegate = notificationDelegate
        // 注册远程推送
        UMPushSwift.registerForRemoteNotifications(launchOptions: launchOptions, entity: entity) { granted, error in
            if granted {
                self.storeRegisteredForRemoteNotifications(true)
            } else {
                if let error = error {
                    self.storeRegisteredForRemoteNotifications(false)
                    self.appendError("注册远程推送失败(UMeng响应): \(error.localizedDescription)")
                }
            }
        }
        // 设置已初始化过推送
        self.setPushInitialized()
    }

    // 持久化存储 `isPrivacyAllow`，使用 UserDefaults
    private let privacyAllowKey = "PushNotificationManager.isPrivacyAllow"
    // 是否允许隐私权限（持久化存储）
    public var isPrivacyAllow: Bool {
        get {
            // 从 UserDefaults 中读取值，默认为 false
            return UserDefaults.standard.bool(forKey: privacyAllowKey)
        }
        set {
            // 将值写入 UserDefaults
            UserDefaults.standard.set(newValue, forKey: privacyAllowKey)
            UserDefaults.standard.synchronize()
        }
    }

    private init() {}

    // 设置已同意隐私权限，并调用 initializeUmengPush 方法
    public func setAllowPrivacy() {
        self.isPrivacyAllow = true
        initializeUmengPush(launchOptions: nil)
    }

    // 设置已初始化过推送
    public func setPushInitialized() {
        self.isPushInitialized = true
    }

    // 追加错误信息，错误和错误之间空两行
    public func appendError(_ error: String) {
        self.error += error + "\n\n"
    }

    // 存储 deviceToken
    public func storeDeviceToken(_ token: Data) {
      // 确保 token 是 NSData 类型
      guard token.count == 32 else {
          self.appendError("注册远程推送失败: deviceToken 长度不正确, 期望长度为 32, 实际长度为 \(token.count)，模拟器的 DeviceToken 通常为 80，会导致注册失败")
          return
      }

      // 将 Data 转换为 UInt32 数组
      let tokenBytes = token.withUnsafeBytes {
          $0.bindMemory(to: UInt32.self)
      }

      // 使用 ntohl 转换字节序，并格式化为 64 位十六进制字符串
      // 这个会将 tokenBytes 中的每个字节的字节序从大端序转换为主机端序
      let hexToken = tokenBytes.map { String(format: "%08x", UInt32(bigEndian: $0)) }.joined()

      self.deviceToken = hexToken
    }

    // 存储设备远程推送注册状态
    public func storeRegisteredForRemoteNotifications(_ isRegisteredForRemoteNotifications: Bool) {
        self.isRegistered = isRegisteredForRemoteNotifications
    }

    // 查询是否允许隐私权限
    public func isAllowPrivacy() -> Bool {
        return self.isPrivacyAllow
    }

    // 查询错误信息
    public func getError() -> String {
        return self.error
    }

    // 查询 deviceToken
    public func getDeviceToken() -> String {
        return self.deviceToken
    }

    // 查询设备远程推送注册状态
    public func isRegisteredForRemoteNotifications() -> Bool {
        return self.isRegistered
    }

    /* tag 相关操作将是直接在 Module 中与 UMPushSwift 交互 */
}

// 定义一个类来处理推送通知的代理方法
class UmengNotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
    // 当接收到推送通知时调用（前台展示时）
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        print("收到推送通知（前台展示）: \(notification.request.content.userInfo)")
        // 选择显示通知的方式：声音、弹窗、角标
        completionHandler([.alert, .badge, .sound])
    }

    // 当用户点击通知时调用
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        print("用户点击通知: \(response.notification.request.content.userInfo)")
        completionHandler()
    }
}