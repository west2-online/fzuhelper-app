import AppIntents
import WidgetKit

// Widget 配置页面，我们可以通过长按 Widget -> Edit Widget 进入这个页面
struct ConfigurationAppIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Widget 配置" }
  static var description: IntentDescription { "设置课程备注和今日结束后的展示方式。" }

  @Parameter(title: "显示课程备注", default: true)
  var showRemarks: Bool

  @Parameter(title: "小号组件今日结束后显示明日", default: false)
  var previewTomorrow: Bool

  static var parameterSummary: some ParameterSummary {
    Summary("课程显示设置") {
      \.$showRemarks
      \.$previewTomorrow
    }
  }
}
