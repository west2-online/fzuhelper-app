'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  recordManagedFile,
  registerHarmonyConfigPlugin,
  withHarmonyDangerousMod,
  withRootOhPackage,
  withRootHvigor,
  withProjectBuildProfile,
  withModuleJson,
  withStrings,
  withColors,
  withProfiles,
  withEntryAbility,
  withIndexPage,
  withCMakeLists,
} = require('@expo-harmony/config-plugins');
const repositoryRoot = path.resolve(__dirname, '..');

const moduleHosts = ['bugly', 'native-widget', 'umeng-bridge'].map(name =>
  path.join(repositoryRoot, 'modules', name, 'harmony/host'),
);
const resourceRoots = moduleHosts.map(root => path.join(root, 'entry/src/main/resources'));
const readJson = file => require('json5').parse(fs.readFileSync(file, 'utf8'));
const mergeNamed = (current = [], incoming = []) => [
  ...new Map([...current, ...incoming].map(item => [item.name, item])).values(),
];

function replaceSource(source, needle, replacement) {
  if (!source.includes(needle)) throw new Error(`expo-harmony host changed: missing ${needle}`);
  return source.replace(needle, replacement);
}

function copyNativeFiles(mod, source, relative = '') {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    const from = path.join(source, entry.name);
    if (entry.isDirectory()) {
      copyNativeFiles(mod, from, name);
    } else {
      // These are merged by their corresponding Expo mods below.
      if (name === 'entry/src/main/module.json5' || /resources\/(base|dark)\/element\//u.test(name)) continue;
      const target = path.join(mod.modRequest.platformProjectRoot, name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(from, target);
      recordManagedFile(mod, target, 'fzuhelper');
    }
  }
}

module.exports = config => {
  const permissionStrings = (config.harmony.permissions ?? [])
    .filter(permission => permission.reason && !permission.reason.startsWith('$string:'))
    .map(permission => ({
      name: `fzuhelper_${permission.name.toLowerCase().replaceAll('.', '_')}`,
      value: permission.reason,
      permission: permission.name,
    }));
  config = registerHarmonyConfigPlugin(config, 'fzuhelper-harmony');
  config = withRootHvigor(config, mod => {
    mod.modResults = replaceSource(
      mod.modResults,
      "process.env.HERMES_V1_ENABLED = 'true';",
      "process.env.EXPO_HARMONY = '1';\nprocess.env.IS_HARMONY = 'true';\nprocess.env.HERMES_V1_ENABLED = 'true';",
    );
    return mod;
  });
  config = withHarmonyDangerousMod(config, mod => {
    for (const root of moduleHosts) copyNativeFiles(mod, root);
    return mod;
  });

  config = withRootOhPackage(config, mod => {
    Object.assign(mod.modResults.dependencies, {
      bugly: '0.4.1',
      '@umeng/analytics': '1.2.12',
      '@umeng/common': '1.1.12',
      '@umeng/push': '2.0.4',
      '@umeng/utunnel': '1.2.5',
    });
    return mod;
  });
  config = withProjectBuildProfile(config, mod => {
    for (const product of mod.modResults.app.products) {
      product.buildOption ??= {};
      product.buildOption.strictMode = { ...product.buildOption.strictMode, useNormalizedOHMUrl: true };
    }
    return mod;
  });
  config = withModuleJson(config, mod => {
    const generated = mod.modResults.module;
    for (const permission of generated.requestPermissions ?? []) {
      const resource = permissionStrings.find(item => item.permission === permission.name);
      if (resource) permission.reason = `$string:${resource.name}`;
    }
    for (const root of moduleHosts) {
      const file = path.join(root, 'entry/src/main/module.json5');
      if (!fs.existsSync(file)) continue;
      const custom = readJson(file).module;
      if (custom.srcEntry) generated.srcEntry = custom.srcEntry;
      generated.extensionAbilities = mergeNamed(generated.extensionAbilities, custom.extensionAbilities);
      generated.abilities = mergeNamed(generated.abilities, custom.abilities);
    }
    generated.metadata = mergeNamed(generated.metadata, [
      { name: 'OPTLazyForEach', value: 'true' },
      { name: 'halfLeading', value: 'true' },
    ]);
    return mod;
  });
  config = withColors(config, mod => {
    mod.modResults.entry.color = mergeNamed(mod.modResults.entry.color, [
      { name: 'primary', value: '#3498D8' },
      { name: 'accent', value: '#1089FF' },
    ]);
    return mod;
  });
  config = withStrings(config, mod => {
    mod.modResults.entry.string = mergeNamed(
      mod.modResults.entry.string,
      permissionStrings.map(({ name, value }) => ({ name, value })),
    );
    return mod;
  });
  for (const [withResource, kind] of [
    [withStrings, 'string'],
    [withColors, 'color'],
  ]) {
    config = withResource(config, mod => {
      for (const root of resourceRoots) {
        for (const scope of ['base', 'dark']) {
          const file = path.join(root, `${scope}/element/${kind}.json`);
          if (!fs.existsSync(file)) continue;
          const key = scope === 'base' ? 'entry' : 'entryDark';
          mod.modResults[key] ??= {};
          mod.modResults[key][kind] = mergeNamed(mod.modResults[key][kind], readJson(file)[kind]);
        }
      }
      return mod;
    });
  }
  config = withProfiles(config, mod => {
    mod.modResults.src = [...new Set([...(mod.modResults.src ?? []), 'pages/WidgetConfigurationPage'])];
    return mod;
  });
  config = withEntryAbility(config, mod => {
    mod.modResults = `import { AbilityConstant, Want } from '@kit.AbilityKit';
import { webview } from '@kit.ArkWeb';
${mod.modResults}`;
    mod.modResults = replaceSource(
      mod.modResults,
      '  override getPagePath()',
      `  override onCreate(want: Want, launchParam?: AbilityConstant.LaunchParam): void {
    // Initialize ArkWeb on the UI thread before the cookie TurboModule uses it.
    try {
      webview.WebviewController.initializeWebEngine();
    } catch (error) {
      console.error('[FzuHelper] Failed to pre-initialize ArkWeb: ' + error);
    }
    super.onCreate(want, launchParam);
  }

  override getPagePath()`,
    );
    return mod;
  });
  config = withIndexPage(config, mod => {
    mod.modResults = `import { KeyboardAvoidMode } from '@kit.ArkUI';\n${mod.modResults}`;
    mod.modResults = replaceSource(
      mod.modResults,
      '  build(): void {',
      `  aboutToAppear(): void {
    this.getUIContext().setKeyboardAvoidMode(KeyboardAvoidMode.RESIZE);
  }

  build(): void {`,
    );
    return mod;
  });
  return withCMakeLists(config, mod => {
    mod.modResults = replaceSource(
      mod.modResults,
      'include("${CMAKE_CURRENT_SOURCE_DIR}/autolinking.cmake")',
      'set(NODE_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../node_modules")\nset(OH_MODULES "${OH_MODULES_DIR}")\ninclude("${CMAKE_CURRENT_SOURCE_DIR}/autolinking.cmake")',
    );
    return mod;
  });
};
