#!/usr/bin/env node

const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { syncHarmonyConstants } = require('../modules/expo-constants/scripts/sync-harmony-config');
const { syncHarmonyQuickActions } = require('../modules/expo-quick-actions/scripts/sync-harmony-resources');

const harmonyDir = __dirname;
const projectDir = path.dirname(harmonyDir);
const appConfigPath = path.join(harmonyDir, 'AppScope', 'app.json5');
const quickActionsConfigPath = path.join(projectDir, 'config', 'quick-actions.json');

function commitCount() {
  for (const revision of ['master', 'HEAD']) {
    try {
      const output = execFileSync('git', ['rev-list', '--count', revision], {
        cwd: projectDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      const count = Number.parseInt(output, 10);
      if (Number.isSafeInteger(count) && count >= 0) {
        return count;
      }
    } catch {
      // Try the next revision when the preferred branch is unavailable.
    }
  }
  return 0;
}

const packageJson = JSON.parse(readFileSync(path.join(projectDir, 'package.json'), 'utf8'));
const version = packageJson.version;
const versionDigits = version.replaceAll('.', '');
const versionCode = Number.parseInt(`${versionDigits}${String(commitCount()).padStart(3, '0')}`, 10);

if (!/^\d+(?:\.\d+)*$/.test(version) || !Number.isSafeInteger(versionCode)) {
  throw new Error(`Cannot derive a HarmonyOS versionCode from version ${version}`);
}

const originalAppConfig = readFileSync(appConfigPath, 'utf8');
const updatedAppConfig = originalAppConfig
  .replace(/"versionCode":\s*\d+/, `"versionCode": ${versionCode}`)
  .replace(/"versionName":\s*"[^"]+"/, `"versionName": "${version}"`);

if (updatedAppConfig === originalAppConfig) {
  const alreadyCurrent =
    originalAppConfig.includes(`"versionCode": ${versionCode}`) &&
    originalAppConfig.includes(`"versionName": "${version}"`);
  if (!alreadyCurrent) {
    throw new Error(`Version fields are missing from ${appConfigPath}`);
  }
} else {
  writeFileSync(appConfigPath, updatedAppConfig, 'utf8');
}

syncHarmonyQuickActions({
  abilityName: 'EntryAbility',
  bundleName: JSON.parse(updatedAppConfig).app.bundleName,
  configPath: quickActionsConfigPath,
  moduleName: 'entry',
  projectDir,
  resourceRoot: path.join(harmonyDir, 'entry', 'src', 'main', 'resources', 'base'),
});
syncHarmonyConstants({
  harmonyDir,
  outputPath: path.join(projectDir, '__harmony__', 'expo-config.generated.json'),
  projectDir,
});

console.log(`HarmonyOS version updated to ${version} (${versionCode})`);
