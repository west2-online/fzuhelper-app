import { execSync } from 'child_process';
import { type ExpoConfig } from 'expo/config';
import { withAppBuildGradle, withGradleProperties } from 'expo/config-plugins';

function insertAfter(s: string, searchString: string, content: string): string {
  const index = s.indexOf(searchString);
  return s.slice(0, index) + searchString + content + s.slice(index + searchString.length);
}

function extractVersionNumber(input: string): string | null {
  const match = input.match(/versionName\s+"([^"]+)"/);
  if (match && match[1]) {
    // 去掉小数点并返回结果
    return match[1].replace(/\./g, '');
  }
  return null;
}

function getCommitCountString(): string {
  try {
    const stdout = execSync('git rev-list --count HEAD').toString().trim();
    // 如果长度小于 3，则在前面补充 '0'
    return stdout.length < 3 ? stdout.padStart(3, '0') : stdout;
  } catch (err) {
    console.error('Error executing git command:', err);
    return '000';
  }
}

function withAndroidBuildConfig(config: ExpoConfig): ExpoConfig {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  config = withAppBuildGradle(config, config => {
    let contents = config.modResults.contents;
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
    // versionCode根据commit次数设置
    // 前三位对应版本名，后三位或更多对应commit次数
    contents = contents.replace(
      'versionCode 700001',
      'versionCode ' + extractVersionNumber(contents) + getCommitCountString(),
    );
    // 保留指定语言，缩减包大小
    contents = insertAfter(
      contents,
      'defaultConfig {',
      `
        resourceConfigurations += ['zh-rCN', 'zh-rTW', 'en']`,
    );
    config.modResults.contents = contents;
    return config;
  });
  config = withGradleProperties(config, config => {
    // abi配置
    let arch = config.modResults.find(item => item.type === 'property' && item.key === 'reactNativeArchitectures');
    if (arch && arch.type === 'property') {
      arch.value = 'arm64-v8a';
    }
    return config;
  });
  return config;
}

export default withAndroidBuildConfig;
