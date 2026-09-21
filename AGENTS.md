# AGENTS.md

本文件适用于整个仓库。修改子目录中的代码前，先遵循本文件；若以后某个子目录增加了更具体的 `AGENTS.md`，则以更近的文件为准。

## 项目概览

这是福州大学一码通（fzuhelper）的 Expo / React Native 客户端。项目使用 Expo Router、React 19、React Native、严格模式 TypeScript、NativeWind 和 TanStack Query，同时包含 Android / iOS 本地 Expo Modules 与 Expo Config Plugins。

- 默认分支：`master`
- 推荐环境：Node.js 22、Yarn Classic 1.22.x、JDK 17（Android）
- 包管理器只能使用 Yarn；不要混用 npm、pnpm，也不要无故改写 `yarn.lock`
- `APP_VARIANT=development` 会使用可与正式版共存的开发包名

## 常用命令

```bash
yarn install                         # 安装依赖
yarn start                           # 启动 Expo / Metro
yarn android                         # 预构建并运行 Android
yarn ios                             # 预构建并运行 iOS（需要 macOS）
yarn lint                            # 项目 ESLint 检查
yarn test                            # Jest watch 模式
yarn test --watchAll=false           # 单次运行 Jest
yarn openapi                         # 从配置的 Apifox OpenAPI 地址重新生成请求代码
yarn prebuild:android                # 清理并重新生成 Android 工程
yarn prebuild:ios                    # 清理并重新生成 iOS 工程
```

## 目录职责

- `app/`：Expo Router 文件路由和页面级组合；路由组位于 `(guest)`、`(tabs)` 等目录。
- `app/devtools/`：仅用于开发验证的页面。UI 组件测试入口是 `app/devtools/component-test.tsx`。
- `components/`：跨页面业务组件；`components/ui/` 是主题适配后的基础组件。
- `components/devtools/`：组件测试框架，支持主题、背景、长文本、空/错/加载状态和键盘场景。
- `hooks/`：请求、路由、课程数据和多状态页面等可复用 hooks。
- `context/`：跨组件的业务状态 Provider。
- `api/axios.ts`：统一请求实例、鉴权刷新和错误映射。
- `api/generate/`：由 `yarn openapi` 生成的接口和类型。除非任务明确要求修正生成结果，否则不要手工编辑。
- `lib/`：领域逻辑、常量、用户状态和静态映射。
- `utils/`：文件、下载、主题、WebView、学习中心等基础能力。
- `modules/`：通过 Expo Modules API 维护的本地原生源码；原生修改需要考虑 Android 和 iOS 实现及 TS 导出。
- `plugins/`：Expo prebuild 时运行的 Config Plugins，并在 `app.config.ts` 中注册。
- `android/`、`ios/`：prebuild 生成物，已被 Git 忽略。持久化修改应落在 `app.config.ts`、`plugins/` 或 `modules/`，不要直接修改生成工程。
- `assets/`、`locales/`、`types/`：静态资源、本地化配置和共享类型。
- `tools/checks/`：项目自定义 ESLint 规则；修改规则前先确认其全仓影响。

## 编码约定

- 使用严格 TypeScript，优先补全真实类型，避免新增无必要的 `any`、非空断言或类型绕过。
- 项目别名为 `@/*`；跨目录导入优先使用 `@/`，同目录的短相对路径可以保留。
- 遵循现有 Prettier 配置：单引号、分号、2 空格缩进、120 列。不要为了当前任务格式化不相关文件。
- 导入会由 Prettier 插件整理；保持第三方模块和 `@/` 项目模块分组与现有文件一致。
- 命名和文件风格在旧代码中并不完全统一。修改现有功能时沿用所在目录的风格，不做无关的批量重命名。
- AsyncStorage key 集中放在 `lib/constants.ts`，使用大写下划线并以 `_KEY` 结尾；业务前缀遵循该文件顶部说明。
- 只做完成任务所必需的改动，不顺手清理相邻告警、替换颜色、升级依赖或重构无关逻辑。

## 项目强制导入规则

`.eslintrc.js` 和 `tools/checks/forbidden-imports.js` 会阻止以下直接导入：

- `Text`、`Button`：不要从 `react-native` 导入，使用 `@/components/ui/text`、`@/components/ui/button`。
- `SafeAreaView`：使用 `react-native-safe-area-context`，或按布局需要使用 `useSafeAreaInsets()`。
- `KeyboardAvoidingView`：使用 `react-native-keyboard-controller`。
- `useColorScheme`：业务代码使用 `@/components/app-theme-provider` 提供的 `useTheme()`。

不要通过改成 namespace、动态 require 或复制组件来规避这些规则。确有底层封装需求时，只在最窄范围增加 allowlist。

## 页面与 UI

- 普通页面优先以 `PageContainer` 作为根容器，它负责主题/自定义背景以及 header、底部 tab 的安全间距。
- 样式优先使用 NativeWind `className`，条件类使用 `cn()`；只有动态值、平台 API 或 NativeWind 无法表达时才使用 `style`。
- 业务 UI 使用 `global.css` 和 `tailwind.config.js` 中的语义色，例如 `background`、`card`、`foreground`、`primary`、`muted`、`destructive`、`text-primary` 等。
- 不要在普通业务 UI 中新增 hex/rgb/hsl 或 `bg-gray-100`、`text-red-500` 之类的 Tailwind 绝对色阶。
- 课程卡片、成绩区间、状态矩阵等集中维护且颜色本身承载业务含义的调色板可以保留绝对色；用范围尽可能小的 `eslint-disable` 忽略 `no-restricted-syntax`，不要为了消除 lint 改变其视觉语义。
- 修改主题 token 时同步检查 `global.css`、`tailwind.config.js` 和 `lib/constants.ts` 中的 `NAV_THEME`，并验证浅色、深色和自定义背景。
- UI 改动必须检查文案换行、空数据、加载、错误、键盘弹出，以及 Android/iOS 中受影响的平台差异。
- 新增或显著修改可复用 UI 组件时，在 `app/devtools/component-test.tsx` 中渲染目标组件，使用现有 `ComponentTestFramework` 验证显示效果。如果组件依赖真实路由、相机、系统权限等而不适合该测试页，在 PR 中说明原因并在真实页面验证。

## 数据请求与状态

- 后端接口优先从 `@/api/generate` 使用生成函数；接口定义变化时按 `docs/dev/interface-update.md` 更新配置并执行 `yarn openapi`。
- 请求统一经过 `api/axios.ts`，不要在页面重复实现 access token、refresh token、cookie 刷新或通用错误映射。
- 查询优先复用 `useApiRequest`、TanStack Query 和 `useSafeResponseSolve`。持久化查询必须提供稳定的 `queryKey`，并设置 `meta.persist`/`persist` 约定。
- 有内容/空/无网络/错误/加载状态的页面优先复用 `useMultiStateRequest` 与 `MultiStateView`。
- 不要记录账号、cookie、token、验证码或完整敏感响应；新增存储时同时考虑退出登录清理、过期策略和缓存兼容。

## 原生与构建配置

- `app.config.ts` 是 Expo 配置源，应用版本来自 `package.json`。当前版本号规则要求每一段都是一位数字；除非任务涉及发布，不要修改版本号。
- Config Plugin 的修改放在 `plugins/`，本地原生能力放在 `modules/`；修改后需要重新 prebuild，并进行真实原生构建，Fast Refresh 不足以验证原生代码。
- 新增 Expo Module 时，保持模块名、Android package、iOS pod/module 名和 TypeScript 导出一致；没有原生视图时不要保留无用 View 模板代码。
- 不提交 `android/`、生成的 `ios/`、签名文件、证书、构建产物、`.expo/` 或 `node_modules/`。
- 修改权限、URL scheme、Associated Domains、App Group、推送或组件注册时，同时检查 Android/iOS 配置及现有 Config Plugin，避免只修一个平台。

## 验证与交付

按改动风险执行最小但充分的验证：

1. TypeScript/TSX 改动至少运行 `yarn lint`；不要把 warning 当成与本次任务无关时也批量修掉。
2. 纯逻辑改动有对应测试时运行相关 Jest；新增可独立验证的复杂逻辑时补测试。
3. UI 改动在 `app/devtools/component-test.tsx` 或真实页面验证，并覆盖浅色/深色、自定义背景及受影响的加载状态。
4. 路由、权限、原生模块、Config Plugin 或 `app.config.ts` 改动至少执行对应平台的 prebuild/构建；无法执行的平台在交付说明中明确写出。
5. 依赖改动使用 Yarn 更新 `package.json` 和 `yarn.lock`，确认 Expo/RN 版本兼容及 peer dependency 影响。

提交前查看 `git diff`，确保没有生成物、调试日志、临时测试数据或用户原有的无关改动。PR 描述应写清目标、实际改动、已执行验证、UI 测试情况及未验证风险。
