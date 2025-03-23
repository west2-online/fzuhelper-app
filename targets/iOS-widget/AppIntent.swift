import AppIntents
import WidgetKit

// Widget 配置页面，我们可以通过长按 Widget -> Edit Widget 进入这个页面
struct ConfigurationAppIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Widget 配置" }
  static var description: IntentDescription { "了解小组件的工作原理和常见问题。" }

  // 上次更新时间
  @Parameter(title: "显示上次更新时间", default: true)
  var showLastUpdateTime: Bool
  
  // 上课前 30 分钟激活 LiveActivity（实时活动）
  @Parameter(title: "上课前30分钟激活实时活动", default: true)
  var enableLiveActivity: Bool

  static var parameterSummary: some ParameterSummary {
    Summary("编辑小组件配置") {
      \.$showLastUpdateTime
      \.$enableLiveActivity
    }
    
  }
}
