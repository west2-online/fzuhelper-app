import ExpoModulesCore

public class NativeWidgetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeWidget")

    AsyncFunction("requestPinAppWidget") { (requestCode:Int) -> Int in
      // iOS只能手动添加
      return 2
    }
  }
}
