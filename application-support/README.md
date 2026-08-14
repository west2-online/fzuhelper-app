# application-support

此目录用于存放与应用业务代码分离的构建支持文件和各个平台的适配代码。

## HarmonyOS 相关目录说明

- `harmony-template/`：HarmonyOS 原生工程模板，由 `yarn prebuild:harmony` 生成根目录下的 `harmony/` 工程。
- `harmony-polyfill/`：HarmonyOS 运行时所需的全局补丁、原生系统模块封装和生成的 Expo 配置。
- `harmony-adapters/`：HarmonyOS 对 Expo、React Native 及第三方依赖的模块适配实现。
- `harmony-mocks/`：HarmonyOS 暂不支持的依赖接口所使用的兼容性 mock。

除 `harmony-template/` 外，其余目录中的文件通常由 HarmonyOS 的 Metro 打包流程或运行时直接引用。修改生成配置前，请先确认对应的构建脚本和入口文件。
