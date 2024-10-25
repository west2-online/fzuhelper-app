# Android 应用程序构建指南

## 预先准备

环境配置参考 README.md 里的版本安装。

## 预构建

在项目根目录中执行：

```bash
yarn prebuild:android
```

## 配置签名文件

**注意一定不要把签名文件上传到 Git 仓库中！**

从学长那里把签名文件及其密码要过来，然后在 `android/gradle.properties` 中添加以下内容：

```env
FZUHELPER_UPLOAD_STORE_FILE=***
FZUHELPER_UPLOAD_KEY_ALIAS=***
FZUHELPER_UPLOAD_STORE_PASSWORD=***
FZUHELPER_UPLOAD_KEY_PASSWORD=***
```

需要注意的是，上面的文件路径是相对于 `android/app` 的。

修改 `android\app\build.gradle`，添加以下内容：

```diff
android {
  signingConfigs {
    // ...
+   release {
+     if (project.hasProperty('FZUHELPER_UPLOAD_STORE_FILE')) {
+       storeFile file(FZUHELPER_UPLOAD_STORE_FILE)
+       storePassword FZUHELPER_UPLOAD_STORE_PASSWORD
+       keyAlias FZUHELPER_UPLOAD_KEY_ALIAS
+       keyPassword FZUHELPER_UPLOAD_KEY_PASSWORD
+     }
    }
  }
  buildTypes {
    // ...
    release {
      signingConfig signingConfigs.debug
+     signingConfig signingConfigs.release
      minifyEnabled false
      // ...
    }
  }
}
```

## 修改构建版本号

修改 `app.json` 中的 `expo.android.versionCode` 字段，每次递增 1 即可。

这个版本号并不是显示的版本号，是用来让系统识别构建版本的。

## 构建

前往 `app` 目录，执行：

```bash
./gradlew app:bundleRelease
./gradlew app:packageReleaseUniversalApk
```

第一个命令会构建出一个 `aab` 文件（`android\app\build\outputs\bundle\release\app-release.aab`），用于一些应用商店的上传；第二个命令会构建出一个 `apk` 文件（`android\app\build\outputs\apk_from_bundle\release\app-release-universal.apk`），用于另外一些应用商店的上传和官网发布。
