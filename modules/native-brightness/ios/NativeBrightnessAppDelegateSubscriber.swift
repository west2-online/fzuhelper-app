import ExpoModulesCore
import UIKit

public class NativeBrightnessAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func applicationWillResignActive(_ application: UIApplication) {
    print("start applicationWillResignActive")
    // 应用进入后台时恢复原有亮度
    print(String(format: "recover previous brightness: %.01f", NativeBrightnessModule.previousBrightness))
    UIScreen.main.brightness = NativeBrightnessModule.previousBrightness
    // 恢复设备的休眠行为
    if (UIApplication.shared.isIdleTimerDisabled && NativeBrightnessModule.isHighBrightnessEnabled) {
      UIApplication.shared.isIdleTimerDisabled = false
    }
    print("end applicationWillResignActive")
  }
  public func applicationWillEnterForeground(_ application: UIApplication) {
    print("start applicationWillEnterForeground")
    // 应用回到前台时，如果之前开启了高亮，则重新设置亮度
    if (NativeBrightnessModule.isHighBrightnessEnabled) {
      UIScreen.main.brightness = 1.0
      UIApplication.shared.isIdleTimerDisabled = true
    }
    print("end applicationWillEnterForeground")
  }
}
