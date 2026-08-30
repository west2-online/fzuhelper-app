# HarmonyOS 运行时补丁

此目录存放 HarmonyOS JavaScript 运行时需要的补丁和原生系统模块封装：

- `install-expo-polyfill.harmony.js`：在 HarmonyOS 启动时安装 Expo 所需的全局能力，并补齐 Web Crypto 的随机数接口。
- `native-system.harmony.js`：获取 HarmonyOS 原生 `HarmonySystem` TurboModule。
- `expo-config.generated.json`：由 `yarn prebuild:harmony` 生成的 Expo 配置，不要手动修改。

`index.harmony.js` 和部分 HarmonyOS 专用模块会引用这里的文件。
