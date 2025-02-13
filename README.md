# fzuhelper-app

## Getting started

<details>
<summary><b>@renbaoshuo's local development environment (Android) [click to expand]</b></summary>

_Updated at Feb 11, 2025._

- Develop machine: Intel(R) Core(TM) Ultra 9 185H, 64 GiB RAM
- Operating system: Windows 11 Pro 24H2 (26100.2314)

| Software or tool name   | Version                                      |
| ----------------------- | -------------------------------------------- |
| Node.js                 | 22.12.0                                      |
| Android Studio          | 2024.2.2                                     |
| Android SDK             | 35 (Android 15.0)                            |
| NDK                     | 28.0.12674087                                |
| OpenJDK                 | 17.0.13+11 (winget, Microsoft.OpenJDK.17)    |
| Android Studio Emulator | Medium Phone API 35 (Android 15.0, x86_64)   |
| Real device             | Samsung Galaxy S10+ (Android 12, One UI 4.1) |

</details>

Before you start, make sure you have [Node.js](https://nodejs.org/), [Yarn](https://yarnpkg.com/), and [Android Studio](https://developer.android.com/studio) installed on your computer.

Then create an Android Studio emulator, you can follow the instructions in the [Expo documentation](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=simulated).

After you have installed the required software, you can start developing the app.

Clone the repository and install dependencies:

```bash
git clone https://github.com/renbaoshuo/fzuhelper-app.git
cd fzuhelper-app
yarn install
```

Start the app:

```bash
yarn start
```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## 更新接口文档后自动生成请求

已有 Apifox 接口文档，生成请求client，推荐后端给每个接口都打上 tags，不要使用 apifox 的 API文档目录 作为 tags

1. 打开 Apifox 桌面客户端
2. 选择需要查阅 API 文档的服务，点击进入
3. 点击服务左侧工具栏目中的 项目设置
4. 点击 导出数据
5. 选择 OpenAPI Spec 版本：OpenAPI3.0 ，文件格式：JSON，包含 Apifox 扩展的 OpenAPI 字段（x-apifox-\*\*\*）：包含，将 API 文档的目录，作为 Tags 字段导出：否
6. 导出范围 导出全部 排除标签 admin
7. 点击 打开URL 按钮，会生成类似以下的临时的接口文档链接：http://127.0.0.1:4523/export/openapi/2?version=3.0
8. 修改 openapi-ts-request.config.ts 文件中的schemaPath为上面的链接
9. 运行 yarn run openapi 自动生成请求代码
