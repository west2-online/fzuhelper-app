// https://github.com/expo/expo/issues/36591#issuecomment-2849092926
import configPlugins from '@expo/config-plugins';
import { type ExpoConfig } from 'expo/config';
const { withAppBuildGradle, withGradleProperties, withSettingsGradle } = configPlugins;

function insertAfter(s: string, searchString: string, content: string): string {
  const index = s.indexOf(searchString);
  return s.slice(0, index) + searchString + content + s.slice(index + searchString.length);
}

function withAppBuildGradleConfig(config: ExpoConfig): ExpoConfig {
  return withAppBuildGradle(config, appBuildGradleConfig => {
    let contents = appBuildGradleConfig.modResults.contents;
    // 签名配置
    contents = insertAfter(
      contents,
      'signingConfigs {',
      `
        release {
            def keystorePath = System.getenv("KEYSTORE_PATH")
            if (keystorePath) {
                storeFile = file(keystorePath)
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD")
            }
        }`,
    );
    contents = contents.replace(
      `// Caution! In production, you need to generate your own keystore file.\n            // see https://reactnative.dev/docs/signed-apk-android.\n            signingConfig signingConfigs.debug`,
      'signingConfig signingConfigs.release',
    );
    // abi配置
    contents = insertAfter(
      contents,
      'android {',
      `
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "arm64-v8a"
        }
    }`,
    );
    // 保留指定语言，缩减包大小
    contents = insertAfter(
      contents,
      'defaultConfig {',
      `
        resourceConfigurations += ['zh', 'zh-rCN', 'zh-rTW', 'en']`,
    );
    // https://kirillzyusko.github.io/react-native-keyboard-controller/docs/troubleshooting#filename-longer-than-260-characters
    if (process.platform === 'win32') {
      contents = insertAfter(
        contents,
        'defaultConfig {',
        `
        externalNativeBuild {
            cmake {
                arguments "-DCMAKE_MAKE_PROGRAM=\${projectDir}/../../ninja-v1.13.1.exe",
                    "-DCMAKE_OBJECT_PATH_MAX=1024"
            }
        }`,
      );
      console.warn(
        'Run the following PowerShell command once to enable long path support in Windows:\n',
        'New-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force',
      );
    }
    appBuildGradleConfig.modResults.contents = contents;
    return appBuildGradleConfig;
  });
}

function withGradlePropertiesConfig(config: ExpoConfig): ExpoConfig {
  return withGradleProperties(config, gradlePropertiesConfig => {
    // abi配置
    let arch = gradlePropertiesConfig.modResults.find(
      item => item.type === 'property' && item.key === 'reactNativeArchitectures',
    );
    if (arch && arch.type === 'property') {
      arch.value = 'arm64-v8a';
    }
    return gradlePropertiesConfig;
  });
}

function withSettingsGradleConfig(config: ExpoConfig): ExpoConfig {
  return withSettingsGradle(config, settingsConfig => {
    let contents = settingsConfig.modResults.contents;
    contents = insertAfter(
      contents,
      'plugins {',
      `
  id("com.gradle.enterprise") version("3.16.2")`,
    );
    contents = `${contents.trimEnd()}\n
gradleEnterprise {
  if (System.getenv("CI") != null) {
    buildScan {
      publishAlways()
      termsOfServiceUrl = "https://gradle.com/terms-of-service"
      termsOfServiceAgree = "yes"
    }
  }
}\n`;
    settingsConfig.modResults.contents = contents;
    return settingsConfig;
  });
}

function withAndroidBuildConfig(config: ExpoConfig): ExpoConfig {
  config = withAppBuildGradleConfig(config);
  config = withGradlePropertiesConfig(config);
  config = withSettingsGradleConfig(config);
  return config;
}

export default withAndroidBuildConfig;
