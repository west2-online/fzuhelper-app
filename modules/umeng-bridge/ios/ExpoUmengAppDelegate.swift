import ExpoModulesCore
import UMCommon // 友盟基础模块
import UMPush // 友盟推送模块


// ExpoUmengAppDelegate 用于处理应用程序的生命周期事件
public class ExpoUmengAppDelegate: ExpoAppDelegateSubscriber {

  // 这个方法对应生命周期事件中的 didFinishLaunchingWithOptions，因此在应用程序启动完成时调用
  // 所以在这里初始化友盟推送是合适的，考虑到合规性问题，我们第一次打开 App 时不会立即初始化推送
  // 后续用户同意隐私协议后再初始化推送，再之后将这个“同意隐私协议”持久化到本地
  // 下次打开 app 时就会在这里初始化推送，符合生命周期事件的调用时机
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // The app has finished launching.

    // 检查是否允许隐私协议
    if !PushNotificationManager.shared.isAllowPrivacy() {
        print("用户尚未同意隐私协议，推送初始化被延迟")
        // 直接返回 true，等待用户同意隐私协议后再初始化
        return true
    }

    // 如果用户已经同意隐私协议，则初始化友盟推送
    PushNotificationManager.shared.initializeUmengPush(launchOptions: launchOptions)

    return true
  }

  // 当 APNs 成功返回 deviceToken 时调用
  public func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
      // 先存储 deviceToken
      PushNotificationManager.shared.storeDeviceToken(deviceToken) // 存储 deviceToken
      PushNotificationManager.shared.storeRegisteredForRemoteNotifications(true) // 存储注册状态
      // 调用友盟的 registerDeviceToken 方法
      UMPushSwift.registerDeviceToken(deviceToken)
  }

  // 当 APNs 注册失败时调用
  public func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
      PushNotificationManager.shared.storeRegisteredForRemoteNotifications(false)
      PushNotificationManager.shared.appendError("注册远程推送失败(APNs 响应): \(error.localizedDescription)")
  }

  public func applicationDidBecomeActive(_ application: UIApplication) {
    // The app has become active.
  }

  public func applicationWillResignActive(_ application: UIApplication) {
    // The app is about to become inactive.
  }

  public func applicationDidEnterBackground(_ application: UIApplication) {
    // The app is now in the background.
  }

  public func applicationWillEnterForeground(_ application: UIApplication) {
    // The app is about to enter the foreground.
  }

  public func applicationWillTerminate(_ application: UIApplication) {
    // The app is about to terminate.
  }
}