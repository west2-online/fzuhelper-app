#!/usr/bin/env node

const {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
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

const preservedHarmonyPaths = [
  '.hvigor',
  '.idea',
  'build',
  'oh_modules',
  'oh-package-lock.json5',
  'entry/.cxx',
  'entry/build',
  'entry/oh_modules',
  'entry/oh-package-lock.json5',
  'entry/src/main/cpp/generated',
  'entry/src/main/cpp/RNOHGeneratedPackage.h',
  'entry/src/main/cpp/RNOHPackagesFactory.h',
  'entry/src/main/cpp/autolinking.cmake',
  'entry/src/main/ets/RNOHPackagesFactory.ets',
  'entry/src/main/resources/rawfile/assets',
  'entry/src/main/resources/rawfile/bundle.harmony.js',
];

function isPreservedHarmonyPath(relativePath) {
  const normalizedPath = relativePath.split(path.sep).join('/');
  return preservedHarmonyPaths.some(
    preservedPath =>
      normalizedPath === preservedPath ||
      normalizedPath.startsWith(`${preservedPath}/`) ||
      preservedPath.startsWith(`${normalizedPath}/`),
  );
}

function mirrorGeneratedProjectInPlace(sourceDir, destinationDir, relativeDir = '') {
  mkdirSync(destinationDir, { recursive: true });

  const sourceEntries = new Map(readdirSync(sourceDir, { withFileTypes: true }).map(entry => [entry.name, entry]));

  for (const sourceEntry of sourceEntries.values()) {
    const relativePath = path.join(relativeDir, sourceEntry.name);
    const sourcePath = path.join(sourceDir, sourceEntry.name);
    const destinationPath = path.join(destinationDir, sourceEntry.name);
    const destinationEntry = readdirSync(destinationDir, { withFileTypes: true }).find(
      entry => entry.name === sourceEntry.name,
    );

    if (destinationEntry && destinationEntry.isDirectory() !== sourceEntry.isDirectory()) {
      rmSync(destinationPath, { force: true, recursive: true });
    }

    if (sourceEntry.isDirectory()) {
      mirrorGeneratedProjectInPlace(sourcePath, destinationPath, relativePath);
    } else {
      cpSync(sourcePath, destinationPath, { force: true });
    }
  }

  for (const destinationEntry of readdirSync(destinationDir, { withFileTypes: true })) {
    if (sourceEntries.has(destinationEntry.name)) {
      continue;
    }

    const relativePath = path.join(relativeDir, destinationEntry.name);
    if (!isPreservedHarmonyPath(relativePath)) {
      rmSync(path.join(destinationDir, destinationEntry.name), { force: true, recursive: true });
    }
  }
}

function isWindowsDirectoryLock(error) {
  return process.platform === 'win32' && ['EACCES', 'EBUSY', 'EPERM'].includes(error.code);
}

function replaceGeneratedProject(generatedHarmonyDir, stagingRoot) {
  const previousHarmonyDir = path.join(stagingRoot, 'previous-harmony');
  const hadPreviousProject = existsSync(harmonyDir);

  if (hadPreviousProject) {
    try {
      renameSync(harmonyDir, previousHarmonyDir);
    } catch (error) {
      if (!isWindowsDirectoryLock(error)) {
        throw error;
      }

      console.warn('harmony/ is locked by another Windows process; updating it in place');
      mirrorGeneratedProjectInPlace(generatedHarmonyDir, harmonyDir);
      return;
    }
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
