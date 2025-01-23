# Modules

这个目录是与原生应用做衔接而生，使用了 Expo Modules API

## 边写衔接需要注意的事项

最好先跟着官方的 Tutorial 提供的快速入门做一遍，然后看这个注意事项，再看下面的快速上手

1. 新增一个东西，需要同时提供 Android 和 iOS 的实现，然后在 src 文件夹中再做引用
2. **如果你不需要原生视图渲染，请删除所有和 View 有关的文件/代码，可以直接搜索然后删掉**
3. 本质上是提供了一个接口衔接，可以通过 Modules 调用原生的存储，而不是用浏览器的 local-storage
4. 除了存储外，也可以通过这个接口实现原生特性

## 快速上手

除了官方提供的 [Tutorial](https://docs.expo.dev/modules/get-started/#adding-a-new-module-to-an-existing-application)，这里提供更加简洁的使用方式

### 创建新的模块

```bash
❯ npx create-expo-module@latest --local
Need to install the following packages:
create-expo-module@0.8.8
Ok to proceed? (y) y

npm warn deprecated @xmldom/xmldom@0.7.13: this version is no longer supported, please update to at least 0.8.*

The local module will be created in the modules directory in the root of your project. Learn more: https://expo.fyi/expo-module-local-autolinking.md

✔ What is the name of the local module? … native-request
✔ What is the native module name? … NativeRequest
✔ What is the Android package name? … com.west2online.nativerequest

✔ Downloaded module template from npm
✔ Created the module from template files

✅ Successfully created Expo module in modules/native-request

You can now import this module inside your application.
For example, you can add this line to your App.js or App.tsx file:
import NativeRequestModule './modules/native-request';

Learn more on Expo Modules APIs: https://docs.expo.dev/modules
Remember to re-build your native app (for example, with npx expo run) when you make changes to the module. Native code changes are not reloaded with Fast Refresh.
```

提炼几个关键的地方：`native module name`和`Android package name`，这个需要特别注意

这个提示后面还提供了使用方法，直接 import 这个 module 就可以了，后续实现都在这个模块里完成

### 常见结构

下面这个结构是已经删除了 View 后的结果，默认生成的会更多一些

```text
❯ tree native-request
native-request
├── android
│   ├── build.gradle
│   └── src
│       └── main
│           ├── AndroidManifest.xml // Android 核心配置文件
│           └── java
│               └── com
│                   └── west2online
│                       └── nativerequest
│                           └── NativeRequestModule.kt // Android 模块代码
├── expo-module.config.json // Expo 的模块配置，通常不需要修改
├── index.ts // 此处进行统一声明暴露
├── ios
│   ├── NativeRequest.podspec // iOS 核心配置文件
│   └── NativeRequestModule.swift // iOS 模块代码
└── src
    ├── NativeRequest.types.ts
    ├── NativeRequestModule.ts
    └── NativeRequestModule.web.ts

10 directories, 10 files
```

从常见结构也可以看出来，这个 module 实际上提供了 web、Android 和 iOS（含 tvOS）三端的实现，并汇总到`index.ts`文件中

### 编写模块设置

可以通过编辑`ios/{ModuleName}Module.swift`或`android/{Namespace}/{ModuleName}/{ModuleName}Module.kt`来实现

这里可以具体参考 Expo 提供的 [API Reference](https://docs.expo.dev/modules/module-api)，就不多写了

## (iOS) Objective-C 和 Swift 的混合编译

部分厂商懒得编写 swift 代码，只提供了 Objective-C 的实现，因此我们需要实现一个桥接，这个桥接实际上并不难，具体可以参考这篇文章：[Objective-C 與 Swift 混編教學](https://dnz-think.medium.com/objective-c-%E8%88%87-swift-%E6%B7%B7%E7%B7%A8%E6%95%99%E5%AD%B8-2e23ae62c067)

理解了原理后，我们就知道实际上只需要一个桥接的.h 头文件，之后我们就可以直接调用 Objective-C 的代码了

但是在具体的实践过程中，各大厂商会做一个桥接类，所以可以看到 umeng-bridge/ios 下几个 UM 开头 Swift 结尾的文件，看起来很多，其实只是桥接了 Header 而已
