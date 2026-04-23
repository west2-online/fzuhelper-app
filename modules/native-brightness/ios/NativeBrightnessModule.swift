import ExpoModulesCore
import UIKit

public class NativeBrightnessModule: Module {
  static var previousBrightness: CGFloat = 0.0
  
  static var isHighBrightnessEnabled = false

  // 对之前一个亮度调整任务的引用，确保在新的亮度调整请求到来时可以取消之前未完成的任务
  private var brightnessWorkItem: DispatchWorkItem?

  public func definition() -> ModuleDefinition {
    Name("NativeBrightness")

    // 将亮度调到最大
    AsyncFunction("enableHighBrightness") {
      // 尝试取消上一次的任务
      brightnessWorkItem?.cancel()
      let workItem = DispatchWorkItem {
        if (Self.isHighBrightnessEnabled) {
          return
        }
        Self.previousBrightness = UIScreen.main.brightness
        UIScreen.main.brightness = 1.0
        // 禁止设备休眠
        UIApplication.shared.isIdleTimerDisabled = true
        Self.isHighBrightnessEnabled = true
      }
      // 保存当前任务
      brightnessWorkItem = workItem
      // 延迟 0.25秒 执行
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.25, execute: workItem)
    }

    // 将亮度调回默认
    AsyncFunction("disableHighBrightness") {
      // 尝试取消上一次的任务
      brightnessWorkItem?.cancel()
        let workItem = DispatchWorkItem {
          if (!Self.isHighBrightnessEnabled) {
            return
          }
          UIScreen.main.brightness = Self.previousBrightness
          // 恢复设备的休眠行为
          if (UIApplication.shared.isIdleTimerDisabled) {
            UIApplication.shared.isIdleTimerDisabled = false
          }
          Self.isHighBrightnessEnabled = false
        }
      // 保存当前任务
      brightnessWorkItem = workItem
      // 延迟 0.25秒 执行
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.25, execute: workItem)
    }
  }
}
