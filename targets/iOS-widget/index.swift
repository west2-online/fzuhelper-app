import SwiftUI
import WidgetKit

@main
struct exportWidgets: WidgetBundle {
  var body: some Widget {
    // 这里表示你会导出 3 个 Widget，如果有其他 Widget，在这里导出即可
    widget()  // 普通 Widget，标准的桌面组件
    widgetControl()  // Control Widget，可以添加在右上下拉的控制中心中
    //        WidgetLiveActivity() // iOS16 后的 Live Activity，暂时不启用，保留 Demo 代码
  }
}
