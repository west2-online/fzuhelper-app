import ExpoModulesCore
import UIKit

public class NativeBrightnessModule: Module {
  static var previousBrightness: CGFloat = 0.0
  
  static var isHighBrightnessEnabled = false

  public func definition() -> ModuleDefinition {
    Name("NativeBrightness")

    // 将亮度调到最大
    AsyncFunction("enableHighBrightness") {
      if (Self.isHighBrightnessEnabled) {
        return
      }
      if (UIScreen.main.brightness == 1.0) {
        Self.isHighBrightnessEnabled = true
        return
      }
      Self.isHighBrightnessEnabled = true
      Self.previousBrightness = UIScreen.main.brightness
      UIScreen.main.brightness = 1.0
    }.runOnQueue(.main) // 确保在主线程执行

    // 将亮度调回默认
    AsyncFunction("disableHighBrightness") {
      if (!Self.isHighBrightnessEnabled) {
        return
      }
      if (UIScreen.main.brightness == Self.previousBrightness) {
        Self.isHighBrightnessEnabled = false
        return
      }
      Self.isHighBrightnessEnabled = false
      UIScreen.main.brightness = Self.previousBrightness
    }.runOnQueue(.main) // 确保在主线程执行
  }
}
