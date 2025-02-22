import { ExpoConfig } from 'expo/config';
import { withDangerousMod, withInfoPlist } from 'expo/config-plugins';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

function withIOSInject(config: ExpoConfig): ExpoConfig {
  config = withInfoPlist(config, infoPlist => {
    // 如果需要修改 Info.plist，可以在这里添加逻辑
    // 注：在一些 nativemodule 中，可能也会修改这个内容，例如 umeng-bridge

    // // 指定 WKWebView 允许加载的域名
    // infoPlist.modResults.WKAppBoundDomains = [
    //   'jwcjwxt2.fzu.edu.cn',
    //   'jwcjwxt.fzu.edu.cn',
    //   'yjsy.fzu.edu.cn',
    //   'jwch.fzu.edu.cn',
    //   'fzu.edu.cn',
    //   'west2.online',
    //   'w2fzu.com',
    // ];

    // 添加出口合规设置
    // 详见 docs：https://developer.apple.com/documentation/Security/complying-with-encryption-export-regulations
    infoPlist.modResults.ITSAppUsesNonExemptEncryption = false; // 设置为 NO
    infoPlist.modResults.ITSEncryptionExportComplianceCode = ''; // 不需要出口合规文档，保持为空

    // 添加支持直接跳转 App Store 商店
    infoPlist.modResults.LSApplicationQueriesSchemes = ['itms-apps'];

    // 允许访问非 HTTPS 的内容
    infoPlist.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: true,
    };

    // 历年卷权限申请描述
    infoPlist.modResults.NSFileProviderDomainUsageDescription = '我们需要使用文件拓展来保存和上传历年卷文件';

    return infoPlist;
  });
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
