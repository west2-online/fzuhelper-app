#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const projectDir = path.resolve(__dirname, '..', '..');
const reactNativeCli = require.resolve('@react-native-community/cli/build/bin.js');

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
    'index.harmony.js',
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
