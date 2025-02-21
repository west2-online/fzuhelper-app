import { type ExpoConfig } from 'expo/config';
import { withAppBuildGradle } from 'expo/config-plugins';

function insertAfter(s: string, searchString: string, content: string): string {
  const index = s.indexOf(searchString);
  return s.slice(0, index) + searchString + content + s.slice(index + searchString.length);
}

// 比较 dirty 的解决方法，多次 prebuild:android 会破坏 build.gradle 文件
// 需要清除并重新生成项目
// 可能使用正则会更好？
function withAndroidSign(config: ExpoConfig): ExpoConfig {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  return withAppBuildGradle(config, config => {
    let contents = config.modResults.contents;
    contents = insertAfter(
      contents,
      'signingConfigs {',
      `
        release {
            if (project.hasProperty('FZUHELPER_UPLOAD_STORE_FILE')) {
                storeFile file(FZUHELPER_UPLOAD_STORE_FILE)
                storePassword FZUHELPER_UPLOAD_STORE_PASSWORD
                keyAlias FZUHELPER_UPLOAD_KEY_ALIAS
                keyPassword FZUHELPER_UPLOAD_KEY_PASSWORD
            }
        }`,
    );
    contents = insertAfter(
      contents,
      'buildTypes {\n        debug {\n            signingConfig signingConfigs.debug\n        }\n        release {',
      `\n            signingConfig signingConfigs.release`,
    );
    contents = insertAfter(
      contents,
      'android {',
      `
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "arm64-v8a", "x86_64"
        }
    }`,
    );
    config.modResults.contents = contents;
    return config;
  });
}

export default withAndroidSign;
