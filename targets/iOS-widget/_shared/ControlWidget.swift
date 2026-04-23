//
//  widgetControl.swift
//  fzuhelper
//
//  Created by 黄骁 on 2025/3/22.
//

import AppIntents
import SwiftUI
import WidgetKit

@available(iOS 18.0, *)
struct widgetControl: ControlWidget {
    static let kind: String = "online.west2.control.widget"

    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: OpenAppWithURLIntent()) {
                Label("福大一码通", systemImage: "qrcode") // 使用 SF Symbol 的 qrcode 图标
            }
        }
        .displayName("打开福大一码通")
        .description("一键打开福大一码通")
    }
}

@available(iOS 18.0, *)
struct OpenAppWithURLIntent: AppIntent {
    static let title: LocalizedStringResource = "Open App"

    static var openAppWhenRun = true
    static var isDiscoverable = true

    @MainActor
    func perform() async throws -> some IntentResult & OpensIntent {
        let url = URL(string: "fzuhelper://qrcode")!
        EnvironmentValues().openURL(url)
        return .result()
    }
}
