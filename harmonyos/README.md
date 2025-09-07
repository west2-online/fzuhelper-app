# 鸿蒙化项目说明

本App使用Expo开发，由于于华为官方未适配系列库，我们采用打包为Web bundle并打包进鸿蒙hap内，在鸿蒙原生侧实现原生模块的方式，实现最小改动的跨平台。

## 实现原理

harmonyos目录为鸿蒙原生项目目录，用Webview实现渲染；

原生模块部分，在每个模块src目录下新建XXXModule.web.ts文件，编写web端的实现，这个逻辑与Android、iOS是单独的目录不同；
.web.ts中，通过dsbridge与鸿蒙原生侧通信，详见：https://github.com/751496032/DSBridge-HarmonyOS

## 打包命令

package.json中添加了相关打包命令：

yarn web: 在浏览器运行；

yarn bundle: 打包web bundle到./harmonyos/entry/src/main/resources/rawfile/bundle目录，这个目录会直接打包进hap内。

调试时先使用yarn bundle打包web，再编译原生项目。

鸿蒙Web调试见：https://developer.huawei.com/consumer/cn/doc/harmonyos-faqs/faqs-arkweb-61

## 其他说明

由于涉及到部分依赖删除，此分支暂不能合并到主分支。