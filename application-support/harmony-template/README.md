# fzuhelper HarmonyOS 工程模板

本目录为 fzuhelper-app 的 HarmonyOS 原生工程模板，基于 RNOH 0.82.30 构建 Expo/React Native 应用。Android 与 iOS 保持使用 Expo 默认的 React Native 版本，Metro 仅针对 HarmonyOS bundle 切换至 RNOH 及鸿蒙专用实现。由于鸿蒙侧与 Android/iOS 的 React Native 运行时版本存在差异，升级依赖或重构核心代码时需格外注意兼容性。

根目录下的 `harmony/` 工程由 `yarn prebuild:harmony` 自动生成，请勿直接修改生成文件。若需持久化原生改动，请修改本模板、`scripts/harmony/` 内的配置生成脚本或根目录配置文件后重新生成。Umeng 凭据与厂商渠道维护在根目录的 `config/umeng.json` 中，预构建流程会自动将其转换为 ArkTS 常量与 `AppScope/resources/rawfile/umconfig.json`，请勿将 Umeng 配置硬编码写入模板。

## 环境要求

运行本项目需要 DevEco Studio 及 HarmonyOS SDK 20 或更高版本，Node.js 22.14.0+，Yarn 1.22.22+，已配置至环境变量 `PATH` 的 `ohpm` 与 `hvigorw`。

## 开发流程

```sh
yarn install
yarn prebuild:harmony
yarn oh:install
yarn oh
```

HarmonyOS 专用 npm 包均声明在 `optionalDependencies` 中，纯 Android/iOS 环境可使用 `yarn install --ignore-optional` 跳过安装。

在 DevEco Studio 中打开生成的 `harmony/` 目录，配置签名后直接运行 `entry` 模块。

Metro 默认监听 8082 端口，本地端口需要保持不被占用。

开发时可将签名文件放置于 `.harmony-local/` 下并保持相对路径一致，该目录在配置生成后会自动覆盖至工程中（如使用 `.harmony-local/build-profile.json5` 覆盖未签名的默认配置），既便于本地调试又避免误提交泄露敏感信息。

## 离线调试构建

```sh
yarn oh:build
```

该命令会依次更新 `versionCode`，生成 Expo 常量与快捷方式资源，准备 reanimated HAR，安装 HAR 依赖，打包 `bundle.harmony.js`，同步 Metro 资源，并调用 hvigor 构建调试 HAP。其中 `scripts/harmony/prepare-dependencies.js` 仅依赖 Node.js 与系统 `tar` 命令，会自动移除 reanimated 4.0.1 中无效的 `file:../worklets` 依赖声明；应用已单独声明并注册 worklets，因此原生依赖保持完整。若缺少签名配置，仍会输出 `entry/build/default/outputs/default/entry-default-unsigned.hap` 用于编译检查，但该包无法安装至设备。

## 快捷操作

根目录的 `config/quick-actions.json` 是快捷操作的唯一配置源，Android 配置插件、React 共享代码与 HarmonyOS 资源生成脚本均统一读取该文件，请勿手动修改 `entry/src/main/resources/base/{element,media,profile}/expo_quick_actions*` 下的生成代码。`expo_quick_actions` HAR 仅封装冷热启动传递、Expo 事件桥接及可见性切换等底层机制，业务路由、文案、参数与图标完全由应用层配置。HarmonyOS 启动器快捷方式须在构建期静态声明，API 20 仅支持动态修改已声明条目的可见性，不支持在运行时增删条目。

## 原生能力与依赖支持

HarmonyOS 端通过自研 ArkTS TurboModule 实现了 HTTP 网络请求、屏幕亮度、系统分享、状态栏与导航栏、加密摘要与随机数、Umeng Push、快捷操作、桌面卡片、自定义字体、文件 I/O、启动屏协同以及 Bugly 异常上报。`expo-crypto` 保持完整的摘要、随机数与 AES-GCM 能力，其中 AES-GCM 基于现有的 `node-forge` 依赖实现。

RNOH 生态同时提供了 AsyncStorage、WebView、Cookie、Geolocation、blob-util、SVG、SafeArea、Gesture Handler、Reanimated / Worklets、DeviceInfo、LinearGradient、Blur、相机扫码、剪贴板、图片裁剪与缩放、KeyboardController、权限管理、Screens 及 SplashScreen 的移植支持。

目前唯一保留的 Metro mock 为 `react-native-screens/experimental`（因 RNOH screens 暂未发布对应子路径）。对于暂无对等实现的平台能力（如 Android SAF、接收外部分享、断点续传下载及动态卸载字体等），系统均会明确拒绝抛错，避免产生静默失败。Umeng 别名/标签与 Token 注册由原生实现并复用现有服务端推送链路，无需额外集成 Push Kit。Bugly 初始化需在 `entry/src/main/resources/base/element/string.json` 中配置产品凭据。

后期计划切换到 [expo-harmony](https://github.com/renbaoshuo/expo-harmony) 的 Expo 鸿蒙原生模块实现，届时将移除现有的各种 mock。

桌面卡片须通过系统卡片选择器手动添加。“下一节课”同时支持 2×2 桌面卡片与 1×2 单色锁屏卡片。发布锁屏卡片前须在 AppGallery Connect 申请并开通“锁屏卡片”开放能力，未获授权的签名包仍可正常编译，但无法在系统锁屏卡片中心展示。

## 关于

本工程兼容层最初由 [@renbaoshuo](https://github.com/renbaoshuo) 实现，如有疑问可以邮件交流。
