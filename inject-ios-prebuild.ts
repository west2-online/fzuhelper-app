import { ExpoConfig } from 'expo/config';
import { withDangerousMod } from 'expo/config-plugins';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

function withIOSInject(config: ExpoConfig): ExpoConfig {
  // 通过 withDangerousMod 注入 iOS 脚本
  config = withDangerousMod(config, [
    'ios',
    async iosConfig => {
      // 将 script/ci_post_clone.sh 复制到 iOS 目录下
      const iosProjectPath = join(iosConfig.modRequest.projectRoot, 'ios'); // iOS 项目目录
      const sourcePath = resolve(iosConfig.modRequest.projectRoot, './scripts/ci_post_clone.sh'); // 脚本文件地址
      const targetPath = join(iosProjectPath, 'ci_scripts/ci_post_clone.sh'); // 目标地址

      try {
        // 确保目标目录存在
        await fs.mkdir(join(targetPath, '..'), { recursive: true });
        // 复制文件
        await fs.copyFile(sourcePath, targetPath);
        console.log(`Copied Prebuild Scripts from ${sourcePath} to ${targetPath}`);
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
