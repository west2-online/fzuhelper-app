//
//  UMPushSwift.swift
//  swiftDemo
//
//  Created by ozlinex on 2025/01/22.
//  Copyright © 2025 ozlinex. All rights reserved.
//  文件来源：参考 UMCommonSwift.swift 和 UMAnalyticsSwift.swift 文件
//

import Foundation

class UMPushSwift: NSObject {
    /**
     友盟推送的注册接口
     - Parameters:
       - launchOptions: 系统的launchOptions启动消息参数用于处理用户通过消息打开应用相关信息。
       - entity: 友盟推送的注册类，如果使用默认的注册，entity 设置为 nil 即可。如需其他的可选择其他参数，具体的参考 demo 或者文档。
       - completionHandler: iOS10授权后的回调。
     */
    static func registerForRemoteNotifications(
        launchOptions: [UIApplication.LaunchOptionsKey: Any]?,
        entity: UMessageRegisterEntity?,
        completionHandler: ((Bool, Error?) -> Void)?) {
        // 调用友盟推送的注册方法
        UMessage.registerForRemoteNotifications(
            launchOptions: launchOptions,
            entity: entity,
            completionHandler: completionHandler
        )
    }

    /**
     解除远程推送的注册（关闭消息推送，实际调用：[[UIApplication sharedApplication] unregisterForRemoteNotifications]）
     iOS10.0，iOS10.1两个版本存在系统bug,调用此方法后可能会导致无法再次打开推送
     */
    static func unregisterForRemoteNotifications () {
        UMessage.unregisterForRemoteNotifications()
    }

    /**
     向友盟注册该设备的 deviceToken，便于发送 Push 消息
     - Parameter deviceToken: APNs 返回的 deviceToken
     */
    static func registerDeviceToken(_ deviceToken: Data?) {
        UMessage.registerDeviceToken(deviceToken)
    }

    /**
     应用处于运行时（前台、后台）的消息处理，回传点击数据
     - Parameter userInfo: 消息参数
     */
    static func didReceiveRemoteNotification(_ userInfo: [AnyHashable: Any]?) {
        UMessage.didReceiveRemoteNotification(userInfo)
    }

    /**
     设置是否允许 SDK 自动清空角标（默认开启）
     - Parameter value: 是否开启角标清空
     */
    static func setBadgeClear(_ value: Bool) {
        UMessage.setBadgeClear(value)
    }

    /**
     设置是否允许 SDK 当应用在前台运行收到 Push 时弹出 Alert 框（默认开启）
     - Parameter value: 是否开启弹出框
     */
    static func setAutoAlert(_ value: Bool) {
        UMessage.setAutoAlert(value)
    }

    /**
     为某个消息发送点击事件
     - Parameter userInfo: 消息参数
     */
    static func sendClickReportForRemoteNotification(_ userInfo: [AnyHashable: Any]?) {
        UMessage.sendClickReport(forRemoteNotification: userInfo)
    }

    /**
     获取当前绑定设备上的所有 tag
     - Parameter completionHandler: 回调函数，返回绑定的 tag 集合、剩余可用的 tag 数以及可能的错误信息
     */
    static func getTags(completionHandler: @escaping (Set<String>?, Int, Error?) -> Void) {
        UMessage.getTags { responseTags, remain, error in
            // 将 Objective-C 类型的 NSSet 转换为 Swift 的 Set<String>
            let tags = responseTags as? Set<String>
            completionHandler(tags, remain, error)
        }
    }

    /**
     绑定一个或多个 tag 至设备
     - Parameters:
       - tags: 需要绑定的 tag，可以是单个字符串或字符串集合（`String` 或 `[String]`）
       - completionHandler: 回调函数，返回绑定的 tag 集合、剩余可用的 tag 数以及可能的错误信息
     */
    static func addTags(_ tags: Any, completionHandler: @escaping (Any?, Int, Error?) -> Void) {
        UMessage.addTags(tags) { responseObject, remain, error in
            completionHandler(responseObject, remain, error)
        }
    }

    /**
     删除设备中绑定的一个或多个 tag
     - Parameters:
       - tags: 需要删除的 tag，可以是单个字符串或字符串集合（`String` 或 `[String]`）
       - completionHandler: 回调函数，返回删除的 tag 集合、剩余可用的 tag 数以及可能的错误信息
     */
    static func deleteTags(_ tags: Any, completionHandler: @escaping (Any?, Int, Error?) -> Void) {
        UMessage.deleteTags(tags) { responseObject, remain, error in
            completionHandler(responseObject, remain, error)
        }
    }

// 后续还有桥接函数没有实现，可以参考 docs/codes/UMessage.h 文件中的函数定义，自行实现，可以交给 GPT
}
