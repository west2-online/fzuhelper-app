#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const { resolveEntryPoint } = require('expo/config/paths');

const projectDir = path.resolve(__dirname, '..', '..');
const reactNativeCli = require.resolve('@react-native-community/cli/build/bin.js');

// package.json#main 指向 @expo-harmony/entry，需要让 Expo 解析出实际文件路径，
// 否则 bundle-harmony 无法以 package.json#main 作为唯一入口来源。
const entryFile = resolveEntryPoint(projectDir, { platform: 'harmony' });

// react-native-css-interop 不会给 "harmony" 主动生成 .cache/harmony.js，这里建一个占位
const fs = require('node:fs');
const cacheDir = path.join(projectDir, 'node_modules/react-native-css-interop/.cache');
fs.mkdirSync(cacheDir, { recursive: true });
const harmonyCacheFile = path.join(cacheDir, 'harmony.js');
if (!fs.existsSync(harmonyCacheFile)) {
  fs.writeFileSync(harmonyCacheFile, '');
}

const result = spawnSync(
  process.execPath,
  [
    reactNativeCli,
    'bundle-harmony',
    '--dev',
    'false',
    '--minify',
    'true',
    '--js-engine',
    'any',
    '--entry-file',
    entryFile,
    '--config',
    'metro.config.js',
    '--bundle-output',
    'harmony/entry/src/main/resources/rawfile/bundle.harmony.js',
    '--assets-dest',
    'harmony/entry/src/main/resources/rawfile/assets',
  ],
  {
    cwd: projectDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_METRO_TARGET: 'harmony',
      RNOH_C_API_ARCH: '1',
    },
  },
);

if (result.error) {
  throw result.error;
}

if (typeof result.status === 'number' && result.status !== 0) {
  process.exit(result.status);
}
