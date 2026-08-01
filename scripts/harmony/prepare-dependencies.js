#!/usr/bin/env node

/**
 * Apply reproducible packaging fixes required before `ohpm install`.
 *
 * The published reanimated 4.0.1 HAR points at a sibling source directory
 * (`file:../worklets`) which does not exist in an npm installation. Worklets
 * is already an explicit root dependency and is registered by this
 * application, so the invalid nested dependency must be removed from the HAR
 * manifest. The published safe-area port also reads window properties while
 * EntryAbility's window can still be under construction, so its synchronous
 * initial-metrics lookup needs a zero-metrics fallback.
 */

const { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const projectDir = path.resolve(__dirname, '../..');
const reanimatedHar = path.join(
  projectDir,
  'node_modules',
  '@react-native-ohos',
  'react-native-reanimated',
  'harmony',
  'reanimated.har',
);
const safeAreaHar = path.join(
  projectDir,
  'node_modules',
  '@react-native-ohos',
  'react-native-safe-area-context',
  'harmony',
  'safe_area.har',
);
const workletsDependency = '@react-native-ohos/react-native-worklets';

function runTar(args) {
  try {
    return execFileSync('tar', args, {
      encoding: 'utf8',
      env: { ...process.env, COPYFILE_DISABLE: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('`tar` is required to prepare Harmony dependencies');
    }
    const details = error.stderr?.trim();
    throw new Error(details || `tar ${args.join(' ')} failed`);
  }
}

function inspectArchive(archivePath, archiveName) {
  const entries = runTar(['-tzf', archivePath]).split(/\r?\n/u);
  let hasMacMetadata = false;
  for (const entry of entries) {
    if (!entry) {
      continue;
    }
    const normalized = entry.replaceAll('\\', '/');
    const segments = normalized.split('/');
    if (segments.includes('__MACOSX') || segments.some(segment => segment.startsWith('._'))) {
      hasMacMetadata = true;
    }
    if (
      normalized.startsWith('/') ||
      /^[A-Za-z]:\//u.test(normalized) ||
      segments.includes('..') ||
      (segments[0] !== 'package' && segments[0] !== '.')
    ) {
      throw new Error(`Unsafe path in ${archiveName} HAR: ${entry}`);
    }
  }
  return hasMacMetadata;
}

function patchReanimatedHar() {
  if (!existsSync(reanimatedHar)) {
    throw new Error(`${reanimatedHar} is missing; run \`yarn install\` before preparing Harmony dependencies`);
  }

  const temporaryDir = mkdtempSync(path.join(os.tmpdir(), 'fzuhelper-reanimated-'));
  const replacement = `${reanimatedHar}.tmp`;

  try {
    const hasMacMetadata = inspectArchive(reanimatedHar, 'reanimated');
    runTar(['-xzf', reanimatedHar, '-C', temporaryDir]);

    const manifestPath = path.join(temporaryDir, 'package', 'oh-package.json5');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const dependencies = manifest.dependencies ?? {};
    const hasInvalidDependency = workletsDependency in dependencies;
    if (!hasInvalidDependency && !hasMacMetadata) {
      console.log('Reanimated HAR is already prepared');
      return;
    }

    if (hasInvalidDependency) {
      delete dependencies[workletsDependency];
      writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');
    }

    rmSync(replacement, { force: true });
    runTar(['-czf', replacement, '-C', temporaryDir, 'package']);
    renameSync(replacement, reanimatedHar);
    const changes = [];
    if (hasInvalidDependency) {
      changes.push('invalid file:../worklets dependency');
    }
    if (hasMacMetadata) {
      changes.push('macOS metadata');
    }
    console.log(`Removed ${changes.join(' and ')} from reanimated HAR`);
  } finally {
    rmSync(replacement, { force: true });
    rmSync(temporaryDir, { force: true, recursive: true });
  }
}

function patchSafeAreaHar() {
  if (!existsSync(safeAreaHar)) {
    throw new Error(`${safeAreaHar} is missing; run \`yarn install\` before preparing Harmony dependencies`);
  }

  const temporaryDir = mkdtempSync(path.join(os.tmpdir(), 'fzuhelper-safe-area-'));
  const replacement = `${safeAreaHar}.tmp`;
  const fallbackMarker = 'Safe area metrics are unavailable while the window is being created.';

  try {
    inspectArchive(safeAreaHar, 'safe-area');
    runTar(['-xzf', safeAreaHar, '-C', temporaryDir]);

    const modulePath = path.join(temporaryDir, 'package', 'src', 'main', 'ets', 'SafeViewTurboModule.ts');
    const source = readFileSync(modulePath, 'utf8');
    if (source.includes(fallbackMarker)) {
      console.log('Safe-area HAR is already prepared');
      return;
    }

    const guardedWindowLookup =
      / {4}if \(this\.windowInstance != null\) \{\r?\n([\s\S]*?)\r?\n {4}\}\r?\n {4}return \{ "initialWindowMetrics"/u;
    const match = source.match(guardedWindowLookup);
    if (!match) {
      throw new Error('Safe-area HAR no longer contains the expected initial-metrics lookup');
    }

    const guardedBody = match[1]
      .split(/\r?\n/u)
      .map(line => `  ${line}`)
      .join('\n');
    const patchedSource = source.replace(
      guardedWindowLookup,
      [
        '    if (this.windowInstance != null) {',
        '      try {',
        guardedBody,
        '      } catch (error) {',
        `        Logger.debug(TAG, '${fallbackMarker}' + JSON.stringify(error));`,
        '      }',
        '    }',
        '    return { "initialWindowMetrics"',
      ].join('\n'),
    );
    writeFileSync(modulePath, patchedSource, 'utf8');

    rmSync(replacement, { force: true });
    runTar(['-czf', replacement, '-C', temporaryDir, 'package']);
    renameSync(replacement, safeAreaHar);
    console.log('Added window-lifecycle fallback to safe-area HAR');
  } finally {
    rmSync(replacement, { force: true });
    rmSync(temporaryDir, { force: true, recursive: true });
  }
}

patchReanimatedHar();
patchSafeAreaHar();
