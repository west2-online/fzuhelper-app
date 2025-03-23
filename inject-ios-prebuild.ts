import { ExpoConfig } from 'expo/config';
import { withDangerousMod, withXcodeProject, XcodeProject } from 'expo/config-plugins';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

function withIOSInject(config: ExpoConfig): ExpoConfig {
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

  // 以下代码适用于将主应用 app（fzuhelper）添加到 iOS-Widget 的 Target Membership 中
  // 目前以下功能已经由 @bacon/expo-apple-target 实现，但是考虑到后续可能会有类似的操作（即往 xcodeproj 文件中做修改）
  // 我们保留下列设计，以供参考
  // /**
  //  * 查找 PBXFileSystemSynchronizedRootGroup 的条目
  //  */
  // const findRootGroupByPath = (xcodeProject: XcodeProject, path: string) => {
  //   const rootGroups = xcodeProject.hash.project.objects['PBXFileSystemSynchronizedRootGroup'];
  //   return Object.entries(rootGroups).find(([key, value]) => value.path === path);
  // };

  // config = withXcodeProject(config, xcodeConfig => {
  //   const xcodeProject = xcodeConfig.modResults;

  //   // 生成新的 UUID
  //   const newExceptionSetUUID = xcodeProject.generateUuid();

  //   // 找到主 target 的 UUID
  //   const mainTargetUUID = xcodeProject.getFirstTarget().uuid;

  //   // 创建新的 PBXFileSystemSynchronizedBuildFileExceptionSet
  //   xcodeProject.addToPbxBuildFileExceptionSet({
  //     uuid: newExceptionSetUUID,
  //     isa: 'PBXFileSystemSynchronizedBuildFileExceptionSet',
  //     membershipExceptions: [widgetFile],
  //     target: mainTargetUUID,
  //   });

  //   // 找到 iOS-widget 的 RootGroup
  //   const [rootGroupUUID, rootGroup] = findRootGroupByPath(xcodeProject, 'iOS-widget');

  //   if (!rootGroup) {
  //     throw new Error('Root group for iOS-widget not found!');
  //   }

  //   // 更新 RootGroup 的 exceptions
  //   const updatedExceptions = [
  //     newExceptionSetUUID, // 新增的 ExceptionSet UUID
  //     ...(rootGroup.exceptions || []),
  //   ];

  //   xcodeProject.updatePbxRootGroup({
  //     uuid: rootGroupUUID,
  //     exceptions: updatedExceptions,
  //     path: rootGroup.path,
  //     sourceTree: rootGroup.sourceTree,
  //   });

  //   return xcodeConfig;
  // });

  return config;
}

export default withIOSInject;
