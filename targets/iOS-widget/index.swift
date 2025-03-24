import SwiftUI
import WidgetKit

@main
struct exportWidgets: WidgetBundle {
  var body: some Widget {
    // 这里表示你会导出需要的 Widget，如果有其他 Widget，在这里导出即可
    widget()  // 普通 Widget，标准的桌面组件
    widgetControl()
  }
}
