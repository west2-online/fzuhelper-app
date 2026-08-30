# fzuhelper HarmonyOS 工程模板

此目录是 fzuhelper-app 的 HarmonyOS 原生工程模板，使用 RNOH 0.82.30 构建 Expo/React Native 应用。Android 和 iOS 继续使用 Expo 选择的 React Native 版本；Metro 只会针对 HarmonyOS bundle 切换到 RNOH 及 HarmonyOS 专用实现。

需要注意的是，鸿蒙系统的 React Native 运行时版本和 Android/iOS 的 React Native 运行时版本不一致，升级依赖、重构代码前需要格外留意。

根目录下的 `harmony/` 工程由 `yarn prebuild:harmony` 生成，不要直接修改生成文件。需要持久化的原生改动请写入本模板、`scripts/harmony/` 下的配置生成器，或根目录的配置文件，然后重新生成工程。

Umeng 凭据和厂商渠道标识维护在根目录的 `config/umeng.json` 中。HarmonyOS 预构建会根据该文件生成 ArkTS 常量和 `AppScope/resources/rawfile/umconfig.json`，不要直接把 Umeng 配置写入模板。

## 环境要求

- DevEco Studio 及 HarmonyOS SDK 20 或更高版本
- Node.js 22.14.0 和 Yarn 1.22.22 或更高版本
- 已加入 `PATH` 的 `ohpm` 和 `hvigorw`
- `default` 产品的 DevEco 签名配置

## 开发

```sh
yarn install
yarn prebuild:harmony
yarn oh:install
yarn oh
```

HarmonyOS 专用 npm 包声明在 `optionalDependencies` 中，因此 Android/iOS-only 环境可以使用 `yarn install --ignore-optional`。

在 DevEco Studio 中打开生成的 `harmony/` 目录，配置签名后运行 `entry` 模块。Metro 监听 8082 端口；RNOH 的 `RNAbility` 会将冷启动和热启动的 `fzuhelper://` 链接转交给 React Native `Linking`。

开发者个人的签名配置可以放在 `.harmony-local/` 下，并保持与生成工程相同的相对路径。该目录会在生成配置后覆盖到工程中，例如 `.harmony-local/build-profile.json5` 可以替换未签名的默认配置，同时避免将凭据提交到 Git。

## 离线调试构建

```sh
yarn oh:build
```

该命令会更新 `versionCode`，生成 Expo 常量和启动器快捷方式资源，准备 reanimated HAR，安装 HAR 依赖，生成 `bundle.harmony.js`，复制 Metro 资源，并调用 hvigor 构建调试 HAP。

仓库中的 `scripts/harmony/prepare-dependencies.js` 会移除 reanimated 4.0.1 中无效的 `file:../worklets` 依赖声明。应用已经单独声明并注册 worklets，因此不会移除原生依赖。该脚本使用 Node.js 和系统的 `tar` 命令，不需要 Python。

没有 DevEco 签名配置时，仍会生成用于编译检查的 `entry/build/default/outputs/default/entry-default-unsigned.hap`，但该产物不能安装。

## 快捷操作

根目录的 `config/quick-actions.json` 是应用唯一维护的快捷操作目录。Android 配置插件、共享 React 代码和 HarmonyOS 资源生成都会读取该文件。不要手动修改生成的 `entry/src/main/resources/base/{element,media,profile}/expo_quick_actions*` 文件。

`expo_quick_actions` HAR 只包含可复用的平台机制：冷/热启动传递、Expo 事件桥接和可见性变化。路由、标题、参数和图标仍属于应用配置。HarmonyOS 启动器快捷方式在构建时声明；API 20 可以改变已声明条目的可见性，但不能在运行时创建或修改条目。

## 原生能力覆盖

HarmonyOS 构建使用 ArkTS TurboModule 实现 HTTP、亮度、系统分享、系统栏、加密摘要和随机数、Umeng Push、快捷操作、桌面卡片、字体、文件操作、启动屏协调及 Bugly。`expo-crypto` 保留完整的摘要、随机数和 AES-GCM 能力，其中 AES-GCM 使用项目已有的 `node-forge` 依赖实现。

RNOH 还提供了 AsyncStorage、WebView、Cookie、地理位置、blob-util、SVG、安全区域、手势、reanimated/worklets、设备信息、线性渐变、模糊、相机扫描、剪贴板、图片裁剪、图片缩放、键盘控制器、权限、screens 和启动屏等依赖的移植。HarmonyOS 专用 npm 包位于 `optionalDependencies` 中。

当前唯一保留的 Metro mock 是 `react-native-screens/experimental`，因为 RNOH screens 包没有发布对应子路径。没有等价实现的平台能力会被明确拒绝，而不会返回虚假的成功结果，例如 Android SAF、传入分享内容、可恢复下载和字体卸载等。Umeng 标签操作和 token 注册由原生实现，因此 HarmonyOS 复用现有 Umeng 服务端受众链路，不需要额外的 Push Kit 集成。Bugly 初始化需要在 `entry/src/main/resources/base/element/string.json` 中配置 HarmonyOS 产品凭据。桌面卡片必须通过系统的手动卡片选择器添加。

## 关于

这个兼容层是由 [@renbaoshuo](https://github.com/renbaoshuo) 最初实现的，如有问题可以邮件联系。
