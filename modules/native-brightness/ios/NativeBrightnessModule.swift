import ExpoModulesCore

let brightnessChangeEvent = "fzuhelper.brightnessDidChange"

public class NativeBrightnessModule: Module {
  private var previousBrightness: CGFloat = UIScreen.main.brightness
  private var hasListeners = false

  public func definition() -> ModuleDefinition {
    Name("NativeBrightness")

    Events(brightnessChangeEvent)

    // 将亮度调到最大
    AsyncFunction("enableHighBrightness") {
      // 记录当前亮度值
      self.previousBrightness = UIScreen.main.brightness
      UIScreen.main.brightness = 1.0

      // 禁止设备休眠
      UIApplication.shared.isIdleTimerDisabled = true
    }
    .runOnQueue(.main)

    // 将亮度调回默认
    AsyncFunction("disableHighBrightness") {
      // 恢复到之前记录的亮度值
      UIScreen.main.brightness = self.previousBrightness

      // 恢复设备的休眠行为
      if UIApplication.shared.isIdleTimerDisabled {
        UIApplication.shared.isIdleTimerDisabled = false
      }
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
