# HarmonyOS 模块适配器

此目录存放 HarmonyOS 对 Expo、React Native 及第三方依赖的 JavaScript 适配实现。文件通常以 `.harmony.js` 结尾，由 `metro.config.js` 在 HarmonyOS 打包时重定向到对应模块。

适配器用于复用现有 API、替换不兼容实现，或连接 HarmonyOS 原生能力。修改适配器时，应同时检查 `metro.config.js` 中的模块映射。
