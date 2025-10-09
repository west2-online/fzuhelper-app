#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 生成构建版本号的脚本
 * 从 app.config.ts 中抽取的逻辑
 */
function generateBuildNumber() {
  try {
    // 读取 package.json 获取版本号
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;

    // 内部版本号根据commit次数设置
    // 前三位对应版本名，后三位或更多对应commit次数
    let commitCount = 0;
    try {
      const stdout = execSync('git rev-list --count HEAD').toString().trim();
      const parsedInt = parseInt(stdout, 10);
      if (!isNaN(parsedInt)) {
        commitCount = parsedInt;
      }
    } catch (err) {
      console.error('无法获取 git commit 次数，将使用默认值 0:', err);
    }

    const versionCodePrefix = version.replace(/\./g, '');
    const versionCodeSuffix = String(commitCount).padStart(3, '0');

    // iOS buildNumber
    const buildNumber = versionCodePrefix + versionCodeSuffix;

    return buildNumber;
  } catch (error) {
    console.error('生成构建版本号时出错:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，输出构建版本号
if (require.main === module) {
  console.log(generateBuildNumber());
}

module.exports = { generateBuildNumber };
