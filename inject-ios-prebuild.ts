import { ExpoConfig } from 'expo/config';
import { withDangerousMod, withXcodeProject } from 'expo/config-plugins';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

function withIOSInject(config: ExpoConfig): ExpoConfig {
  // 侵入项目，配置 Build Settings
  config = withXcodeProject(config, xcodeConfig => {
    const project = xcodeConfig.modResults;
    // 配置 Build Settings ，以支持 Live Activity
    return xcodeConfig;
  });

  // 修改 Info.plist 文件可以直接通过 app.config.ts 完成
  // 通过 withDangerousMod 注入 iOS 脚本
  config = withDangerousMod(config, [
    'ios',
    async iosConfig => {
      // iOS 项目目录
      const iosProjectPath = join(iosConfig.modRequest.projectRoot, 'ios');

      // 定义需要复制的脚本文件
      const scripts = [
        { source: './scripts/ci_post_clone.sh', target: 'ci_scripts/ci_post_clone.sh' },
        { source: './scripts/ci_post_xcodebuild.sh', target: 'ci_scripts/ci_post_xcodebuild.sh' },
      ];

      try {
        for (const script of scripts) {
          const sourcePath = resolve(iosConfig.modRequest.projectRoot, script.source); // 脚本文件地址
          const targetPath = join(iosProjectPath, script.target); // 目标地址

          // 确保目标目录存在
          await fs.mkdir(join(targetPath, '..'), { recursive: true });
          // 复制文件
          await fs.copyFile(sourcePath, targetPath);
          console.log(`Copied Prebuild Script from ${sourcePath} to ${targetPath}`);
        }
      } catch (error: any) {
        console.error(`Failed to copy Prebuild Scripts: ${error.message}`);
        throw error;
      }

      return iosConfig;
    },
  ]);

  return config;
}

export default withIOSInject;
