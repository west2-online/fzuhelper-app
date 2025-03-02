import ExpoModulesCore

public class NativeStorageModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('NativeStorage')` in JavaScript.
    Name("NativeStorage")

    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants([
      "PI": Double.pi
    ])

    // Defines event names that the module can send to JavaScript.
    Events("onChange")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") {
      return "Hello world! 👋"
    }

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { (value: String) in
      // Send an event to JavaScript.
      self.sendEvent("onChange", [
        "value": value
      ])
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of the
    // view definition: Prop, Events.
    View(NativeStorageView.self) {
      // Defines a setter for the `url` prop.
      Prop("url") { (view: NativeStorageView, url: URL) in
        if view.webView.url != url {
          view.webView.load(URLRequest(url: url))
        }
      }

      Events("onLoad")
    }
  }
}

// import ExpoModulesCore
// import ActivityKit
// import WidgetKit
//
// struct SetDataProps: Record {
//   @Field
//   var message: String
// }
//
// // the module is the message handler between your app and the widget
// // you MUST declare the name of the module and then write whatever functions
// // you wish your app to send over
// public class ExpoWidgetsModule: Module {
//     public func definition() -> ModuleDefinition {
//         Name("ExpoWidgets")
//
//         Function("setWidgetData") { (data: String) -> Void in
//             let logger = Logger(logHandlers: [MyLogHandler()])
//             // here we are using UserDefaults to send data to the widget
//             // you MUST use a suite name of the format group.{your project bundle id}.expowidgets
//             let widgetSuite = UserDefaults(suiteName: "group.expo.modules.widgets.example.expowidgets")
//             widgetSuite?.set(data, forKey: "MyData")
//             logger.log(message: "Encoded data saved to suite group.expo.modules.widgets.example.expowidgets, key MyData")
//             logger.log(message: data)
//
//             // this is optional, but while your app is open and in focus
//             // messages sent to the widget do not count towards its timeline limitations
//             if #available(iOS 14.0, *) {
//                WidgetCenter.shared.reloadAllTimelines()
//             }
//         }
//     }
// }