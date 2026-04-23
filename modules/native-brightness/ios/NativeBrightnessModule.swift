import ExpoModulesCore
import UIKit

let brightnessChangeEvent = "fzuhelper.brightnessDidChange"

public class NativeBrightnessModule: Module {
  static var previousBrightness: CGFloat = 0.0
  
  static var isHighBrightnessEnabled = false

  private var hasListeners = false

  public func definition() -> ModuleDefinition {
    Name("NativeBrightness")

    Events(brightnessChangeEvent)

    // 将亮度调到最大
    AsyncFunction("enableHighBrightness") {
      print("start enableHighBrightness")
      if (Self.isHighBrightnessEnabled) {
        print("high brightness is already enabled, skip storing brightness and setting brightness")
        return
      }
      print(String(format: "store previous brightness: %.01f", UIScreen.main.brightness))
      Self.previousBrightness = UIScreen.main.brightness
      UIScreen.main.brightness = 1.0
      // 禁止设备休眠
      UIApplication.shared.isIdleTimerDisabled = true
      Self.isHighBrightnessEnabled = true
      print("end enableHighBrightness")
    }
    .runOnQueue(.main)

    // 将亮度调回默认
    AsyncFunction("disableHighBrightness") {
      print("start disableHighBrightness")
      if (!Self.isHighBrightnessEnabled) {
        print("high brightness is not enabled, skip recovering brightness")
        return
      }
      print(String(format: "recover previous brightness: %.01f", Self.previousBrightness + 0.1))
      UIScreen.main.brightness = Self.previousBrightness + 0.1
      print(String(format: "now UIScreen.main.brightness: %.01f", UIScreen.main.brightness))
      // 恢复设备的休眠行为
      if (UIApplication.shared.isIdleTimerDisabled) {
        UIApplication.shared.isIdleTimerDisabled = false
      }
      Self.isHighBrightnessEnabled = false
      print("end disableHighBrightness")
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
