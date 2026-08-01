#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const projectDir = path.resolve(__dirname, '..', '..');
const yarnCommand = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';

const result = spawnSync(
  yarnCommand,
  [
    'react-native',
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
    'metro.harmony.config.js',
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
      RNOH_C_API_ARCH: '1',
    },
  }
);

if (result.error) {
  throw result.error;
}

if (typeof result.status === 'number' && result.status !== 0) {
  process.exit(result.status);
}