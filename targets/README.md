# Target

这个目录专门为小组件（含 iOS、Android）而设计，主要原因是 [expo-apple-target](https://github.com/EvanBacon/expo-apple-targets) 只能生成在这个目录。

需要注意的是，安卓和 iOS 的小组件都基本依赖纯原生实现，在跨端架构中，由于主语言是 TypeScript，我们无法实现直接调用原始 ts 方法，而我们实现数据互通的底层逻辑是持久化存储使用了原生存储，因此可以直接从原生存储中读取。

# iOS target

对于 iOS 的组件（不仅仅是桌面组件 Widget，还有 Apple Watch 应用、 App Clip 等target），参考[expo-apple-target](https://github.com/EvanBacon/expo-apple-targets)的教程即可正常生成并 link。

## 通用桥接头

如果你设置了通用的桥接头（即设置了一个 Common 的 Objective-C Bridging Header），可能需要去掉，或者专门为你新增的 Target 做适配。例如，在开发 iOS-Widget 时，我们先写好了 UMeng Bridge，这个自定义的 expo module 的 iOS 实现依赖了一个桥接头（因为友盟不提供 swift SDK），而原先的实现是提供一个公共桥接头目录，的确可以正常运行，但当我们添加小组件后，由于是公共桥接头，小组件也会在这里应用桥接头文件，导致报错`UCommon/UCommon.h not found`

## 如果要添加组件

请注意我们根目录的`app.config.ts`配置文件，在`entitlements`中的`com.apple.security.application-groups`是我们的App Group。

如果你需要新增组件，需要在 [Apple Developer -> Certificates, Identifier & Profiles](https://developer.apple.com/account/resources/identifiers/list) 中添加一个 App Group 的 Identifier（右上角搜索符号右边可以筛选出当前有哪些 App Group），点击添加符号，选择`App Groups`，格式一般为`groups.{ProjectName}.{TargetName}`，例如，项目是 `FzuHelper`，我们可以设计为`groups.FzuHelper.widget`

之后在`Identifier`中找到对应 Project 的 Identifier（例如`fzuhelper-2024`），点开后在 `App Groups` 处点`Edit`，选择需要选中的 target identifier

在这之后，你才可以构建项目并测试、发布
