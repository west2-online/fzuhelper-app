#!/usr/bin/env node

// 修复鸿蒙依赖的 HAR 包，供后续 ohpm install 使用。

const { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const projectDir = path.resolve(__dirname, '..');

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

// 统一解包、重打包和清理；补丁返回改动说明，返回 null 表示无需修改。
function patchPackageHar(packageName, harName, patch) {
  const archive = path.join(projectDir, 'node_modules/@react-native-ohos', packageName, 'harmony', harName);
  if (!existsSync(archive)) return;
  const temporaryDir = mkdtempSync(path.join(os.tmpdir(), `fzuhelper-${packageName}-`));
  const replacement = `${archive}.tmp`;
  try {
    const hasMacMetadata = inspectArchive(archive, packageName);
    runTar(['-xzf', archive, '-C', temporaryDir]);
    const message = patch(path.join(temporaryDir, 'package'), hasMacMetadata);
    if (!message) {
      console.log(`${packageName} HAR is already prepared`);
      return;
    }
    rmSync(replacement, { force: true });
    runTar(['-czf', replacement, '-C', temporaryDir, 'package']);
    renameSync(replacement, archive);
    console.log(message);
  } finally {
    rmSync(replacement, { force: true });
    rmSync(temporaryDir, { recursive: true, force: true });
  }
}

// Reanimated：移除无效的 file:../worklets 依赖（应用已单独注册），并清理 macOS 元数据。
function patchReanimatedHar(root, hasMacMetadata) {
  const manifestPath = path.join(root, 'oh-package.json5');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const dependencies = manifest.dependencies ?? {};
  const workletsDependency = '@react-native-ohos/react-native-worklets';
  const hasInvalidDependency = workletsDependency in dependencies;
  if (!hasInvalidDependency && !hasMacMetadata) return null;

  if (hasInvalidDependency) {
    delete dependencies[workletsDependency];
    writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');
  }

  const changes = [];
  if (hasInvalidDependency) changes.push('invalid file:../worklets dependency');
  if (hasMacMetadata) changes.push('macOS metadata');
  return `Removed ${changes.join(' and ')} from reanimated HAR`;
}

// Safe Area：窗口尚未创建完成时捕获度量读取异常，回退为默认零值。
function patchSafeAreaHar(root) {
  const modulePath = path.join(root, 'src/main/ets/SafeViewTurboModule.ts');
  const source = readFileSync(modulePath, 'utf8');
  const fallbackMarker = 'Safe area metrics are unavailable while the window is being created.';
  if (source.includes(fallbackMarker)) return null;

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
  return 'Added window-lifecycle fallback to safe-area HAR';
}

// Cookies：未指定 domain 时不追加 Domain，由 ArkWeb 根据 URL 设置仅限当前主机的 Cookie。
function patchCookiesHar(root) {
  const modulePath = path.join(root, 'src/main/ets/CookiesModule.ts');
  const source = readFileSync(modulePath, 'utf8');
  const hostOnlyMarker = '未指定 domain 时省略 Domain，由 ArkWeb 根据 URL 设置域名。';
  if (source.includes(hostOnlyMarker) || source.includes('Host-only cookies must omit Domain')) return null;

  const defaultDomainBlock =
    / {6}\} else \{\r?\n {8}cookieBuilder\s*\+=\s*`; domain=\$\{topLevelDomain\}`;?\r?\n {6}\}/u;
  if (!defaultDomainBlock.test(source)) {
    throw new Error('Cookies HAR no longer contains the expected default-domain block');
  }

  const patchedSource = source.replace(defaultDomainBlock, ['      }', `      // ${hostOnlyMarker}`].join('\n'));
  writeFileSync(modulePath, patchedSource, 'utf8');
  return 'Preserved host-only cookies in cookies HAR';
}

// Blob Util：重命名公开头文件，使其与自动链接使用的 RNBlobUtilPackage 类名一致。
function patchBlobUtilHar(root) {
  const expected = path.join(root, 'src/main/cpp/RNBlobUtilPackage.h');
  if (existsSync(expected)) return null;
  const previous = path.join(root, 'src/main/cpp/BlobUtilPackage.h');
  if (!readFileSync(previous, 'utf8').includes('class RNBlobUtilPackage')) {
    throw new Error('BlobUtil HAR package class has changed; review the header-name fix');
  }
  renameSync(previous, expected);
  return 'Fixed react-native-blob-util native autolinking';
}

// WebView：补充 ArkTS 组件 builder 注册，确保 RNOH 能创建 WebView 组件。
function patchWebViewHar(root) {
  const file = path.join(root, 'src/main/ets/RNCWebViewPackage.ets');
  const source = readFileSync(file, 'utf8');
  if (source.includes('createWrappedCustomRNComponentBuilderByComponentNameMap')) return null;
  const declaration = 'export class RNCWebViewPackage extends RNOHPackage  {';
  if (!source.includes(declaration)) throw new Error('WebView HAR package class has changed; review the builder fix');
  const imports = `import { ComponentBuilderContext } from '@rnoh/react-native-openharmony';
import { RNCWebView, WEB_VIEW } from './RNCWebView';

@Builder
function buildWebView(ctx: ComponentBuilderContext) {
  RNCWebView({ ctx: ctx.rnComponentContext, tag: ctx.tag })
}

`;
  const builder = `
  override createWrappedCustomRNComponentBuilderByComponentNameMap(): Map<string, WrappedBuilder<[ComponentBuilderContext]>> {
    return new Map().set(WEB_VIEW, wrapBuilder(buildWebView));
  }
`;
  writeFileSync(file, source.replace(declaration, imports + declaration + builder));
  return 'Fixed react-native-webview native autolinking';
}

patchPackageHar('react-native-reanimated', 'reanimated.har', patchReanimatedHar);
patchPackageHar('react-native-safe-area-context', 'safe_area.har', patchSafeAreaHar);
patchPackageHar('cookies', 'rn_cookies.har', patchCookiesHar);
patchPackageHar('react-native-blob-util', 'blobUtil.har', patchBlobUtilHar);
patchPackageHar('react-native-webview', 'rn_webview.har', patchWebViewHar);
