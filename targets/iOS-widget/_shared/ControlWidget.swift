//
//  widgetControl.swift
//  fzuhelper
//
//  Created by 黄骁 on 2025/3/22.
//

// MARK: 这个文件涉及到 Universal Link，需要放在 _shared 文件夹下，否则无法自动关联 Target Membership，导致 Universal Link 无法打开（显示没有权限）

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

    func perform() async throws -> some IntentResult & OpensIntent {
        // 使用 Universal Link
        // MARK: 这个 Universal Link 需要 fzuhelper-web，也就是我们官网的 AASA 文件配合，以及 app 内的配合，这个 /qrcode 路径不要修改，直接对应 App 内的 Expo-Router 设置的 /qrcode 页面，即一码通
//        let url = URL(string: "https://fzuhelperapp.west2.online/(guest)/?method=qrcode")! // 这个设计保留，但暂时不使用
        let url = URL(string: "https://fzuhelperapp.west2.online/qrcode")!
        return .result(opensIntent: OpenURLIntent(url))
    }
}
