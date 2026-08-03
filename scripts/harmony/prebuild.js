#!/usr/bin/env node

const { cpSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { syncHarmonyConstants } = require('../../modules/expo-constants/scripts/sync-harmony-config');
const { syncHarmonyQuickActions } = require('../../modules/expo-quick-actions/scripts/sync-harmony-resources');
const { syncHarmonyUmengConfig } = require('../../modules/umeng-bridge/scripts/sync-harmony-umeng-config');

const projectDir = path.resolve(__dirname, '../..');
const harmonyTemplateDir = path.join(projectDir, 'application-support', 'harmony-template');
const harmonyDir = path.join(projectDir, 'harmony');
const localOverlayDir = path.join(projectDir, '.harmony-local');
const quickActionsConfigPath = path.join(projectDir, 'config', 'quick-actions.json');
const umengConfigPath = path.join(projectDir, 'config', 'umeng.json');
const expoConfigOutputPath = path.join(
  projectDir,
  'application-support',
  'harmony-polyfill',
  'expo-config.generated.json',
);

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

function syncVersion(generatedHarmonyDir) {
  const appConfigPath = path.join(generatedHarmonyDir, 'AppScope', 'app.json5');
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

  return { appConfig: JSON.parse(updatedAppConfig).app, version, versionCode };
}

function replaceGeneratedProject(generatedHarmonyDir, stagingRoot) {
  const previousHarmonyDir = path.join(stagingRoot, 'previous-harmony');
  const hadPreviousProject = existsSync(harmonyDir);

  if (hadPreviousProject) {
    renameSync(harmonyDir, previousHarmonyDir);
  }

  try {
    renameSync(generatedHarmonyDir, harmonyDir);
  } catch (error) {
    if (hadPreviousProject) {
      renameSync(previousHarmonyDir, harmonyDir);
    }
    throw error;
  }
}

function prebuildHarmony() {
  const stagingRoot = mkdtempSync(path.join(projectDir, '.harmony-prebuild-'));
  const generatedHarmonyDir = path.join(stagingRoot, 'harmony');
  const generatedExpoConfigPath = path.join(stagingRoot, 'expo-config.generated.json');

  try {
    cpSync(harmonyTemplateDir, generatedHarmonyDir, { recursive: true });

    const { appConfig, version, versionCode } = syncVersion(generatedHarmonyDir);
    syncHarmonyQuickActions({
      abilityName: 'EntryAbility',
      bundleName: appConfig.bundleName,
      configPath: quickActionsConfigPath,
      moduleName: 'entry',
      projectDir,
      resourceRoot: path.join(generatedHarmonyDir, 'entry', 'src', 'main', 'resources', 'base'),
    });
    syncHarmonyConstants({
      harmonyDir: generatedHarmonyDir,
      outputPath: generatedExpoConfigPath,
      projectDir,
    });

    if (existsSync(localOverlayDir)) {
      cpSync(localOverlayDir, generatedHarmonyDir, { force: true, recursive: true });
    }

    syncHarmonyUmengConfig({
      configPath: umengConfigPath,
      harmonyDir: generatedHarmonyDir,
    });

    replaceGeneratedProject(generatedHarmonyDir, stagingRoot);
    rmSync(expoConfigOutputPath, { force: true });
    renameSync(generatedExpoConfigPath, expoConfigOutputPath);

    console.log(`Generated harmony/ for ${version} (${versionCode})`);
  } finally {
    rmSync(stagingRoot, { force: true, recursive: true });
  }
}

prebuildHarmony();
