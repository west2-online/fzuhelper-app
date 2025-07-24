# Android 应用程序构建指南

## 预先准备

环境配置参考 README.md 里的版本安装。

## 预构建

在项目根目录中执行：

```bash
yarn prebuild:android
```

如果已经预构建过，执行以下可重新构建：

```bash
yarn prebuild:android --clean
```

也可以直接执行下一步，会自动预构建。

## 构建调试版本

由于引入了本地模块，本项目不能在浏览器中或使用Expo Go运行。

```bash
yarn android # 等价于在Android Studio中执行编译
```

执行后等待编译完成，会自动安装并启动，且启动调试服务器。

如果不涉及原生代码改动，可直接执行下面指令启动调试服务器：

```bash
yarn start
```

App卡在开屏界面不执行构建，多见于设备被重新连接，执行下面指令然后重新冷启动即可：

```bash
adb reverse tcp:8081 tcp:8081
```

也可以用以下命令：

```bash
yarn a:conn
```

(yarn更多命令可在`package.json`中查看)

## 配置签名文件

**注意一定不要把签名文件上传到 Git 仓库中！**

从学长那里把签名文件及其密码要过来，然后在环境变量中添加以下内容：

```env
KEYSTORE_PATH=***
KEYSTORE_PASSWORD=***
KEY_ALIAS=***
KEY_PASSWORD=***
```

## 构建版本

版本名 (`versionName`) 由 `package.json` 中配置的 `version` 字段决定；构建版本号 (`versionCode`) 在每一次 prebuild 后根据版本名、commit 次数信息自动生成，无需也禁止手动修改。

相关逻辑见 `inject-android-config.ts`。

## 构建发行版本

前往 `android` 目录，执行：

```bash
./gradlew app:packageRelease
```

也可任意目录直接执行：

```bash
yarn a:pkg
```

命令会构建出 `apk` 文件（`android/app/build/outputs/apk/release/` 目录下），用于应用商店的上传和官网发布。

可用以下命令快速安装：

```bash
yarn a:install
```
