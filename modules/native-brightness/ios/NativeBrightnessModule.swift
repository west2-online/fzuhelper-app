import ExpoModulesCore
import UIKit

let brightnessChangeEvent = "fzuhelper.brightnessDidChange"

public class NativeBrightnessModule: Module {
  static var previousBrightness: CGFloat = UIScreen.main.brightness
  
  static var isHighBrightnessEnabled = false

  private var hasListeners = false

  public func definition() -> ModuleDefinition {
    Name("NativeBrightness")

    Events(brightnessChangeEvent)

    // 将亮度调到最大
    AsyncFunction("enableHighBrightness") {
      Self.previousBrightness = UIScreen.main.brightness
      UIScreen.main.brightness = 1.0
      // 禁止设备休眠
      UIApplication.shared.isIdleTimerDisabled = true
      Self.isHighBrightnessEnabled = true
    }
    .runOnQueue(.main)

    // 将亮度调回默认
    AsyncFunction("disableHighBrightness") {
      UIScreen.main.brightness = Self.previousBrightness
      // 恢复设备的休眠行为
      if (UIApplication.shared.isIdleTimerDisabled && Self.isHighBrightnessEnabled) {
        UIApplication.shared.isIdleTimerDisabled = false
      }
      Self.isHighBrightnessEnabled = false
    }
    .runOnQueue(.main)

    OnStartObserving {
      hasListeners = true
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.brightnessDidChange),
        name: UIScreen.brightnessDidChangeNotification,
        object: nil
      )
    }

    OnStopObserving {
      hasListeners = false
      NotificationCenter.default.removeObserver(
        self,
        name: UIScreen.brightnessDidChangeNotification,
        object: nil
      )
    }
  }

  @objc
  private func brightnessDidChange() {
    if !hasListeners {
      return
    }
    sendEvent(brightnessChangeEvent, ["brightness": UIScreen.main.brightness])
  }
}
