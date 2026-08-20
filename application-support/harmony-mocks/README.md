# HarmonyOS 兼容性 mock

此目录存放 HarmonyOS 依赖缺少对应实现时使用的兼容性 mock。`metro.config.js` 会在 HarmonyOS 打包时将特定模块重定向到这里。

mock 只用于提供必要的兼容接口，不应伪造平台能力或报告虚假的成功状态。新增 mock 前，请确认依赖确实没有可用的 HarmonyOS 实现。
