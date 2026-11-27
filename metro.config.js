'use strict';

const path = require('node:path');
const { createRequire } = require('node:module');
const { getDefaultConfig } = require('expo/metro-config');

const repositoryRoot = __dirname;
const projectRoot = repositoryRoot;
const config = getDefaultConfig(projectRoot);
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter(extension => extension !== 'svg');
config.resolver.sourceExts.push('svg');

function withHarmony(config) {
  // Native build output contains copied TS sources and large dependency trees.
  // Crawling it during a HAP build can stall Metro and index duplicate modules.
  const blockList = config.resolver.blockList;
  config.resolver.blockList = [
    ...(Array.isArray(blockList) ? blockList : blockList ? [blockList] : []),
    /[/\\](?:oh_modules|\.cxx|\.hvigor)[/\\]/,
    new RegExp(`${path.join(repositoryRoot, 'harmony').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[/\\\\]`),
  ];
  const { withHarmonyConfig } = require('@expo-harmony/metro-config');
  const adapter = name => path.join(repositoryRoot, 'application-support/harmony-adapters', name);
  const quickActionsRoot = path.dirname(require.resolve('expo-quick-actions/package.json'));
  const nativeWindRoot = path.dirname(require.resolve('@react-native-ohos/nativewind/package.json'));
  const safeAreaRequire = createRequire(require.resolve('@react-native-ohos/react-native-safe-area-context/package.json'));
  const safeAreaRoot = path.dirname(safeAreaRequire.resolve('react-native-safe-area-context/package.json'));
  const nativeWindRequire = createRequire(path.join(nativeWindRoot, 'package.json'));
  const cssInteropRoot = path.dirname(nativeWindRequire.resolve('react-native-css-interop/package.json'));

  const harmony = withHarmonyConfig(config, {
    projectRoot,
    aliases: {
      '@': repositoryRoot,
      // JSX, CSS registration and theme hooks must share the port's style registry.
      nativewind: nativeWindRoot,
      'react-native-css-interop': cssInteropRoot,
    },
    redirects: {
      // The native Buffer port requires an unported quick-base64 TurboModule.
      // Its upstream JS implementation preserves the API without a global shim.
      '@craftzdog/react-native-buffer': require.resolve('buffer/'),
      // RNOH disables package exports; select the upstream native entries explicitly.
      'expo-quick-actions': path.join(quickActionsRoot, 'build/index.js'),
      'expo-quick-actions/router': path.join(quickActionsRoot, 'build/router.js'),
      'expo-quick-actions/hooks': path.join(quickActionsRoot, 'build/hooks.js'),
      '@preeternal/react-native-cookie-manager': adapter('cookie-manager.harmony.js'),
      'react-native-keyboard-controller': adapter('react-native-keyboard-controller.harmony.js'),
      'react-native-safe-area-context': adapter('react-native-safe-area-context.harmony.js'),
    },
    emptyModules: [/MaterialSymbols/u],
    resolveRequest({ moduleName, context }) {
      if (
        /^react-native-safe-area-context\/src\/+InitialWindow$/u.test(moduleName) ||
        (moduleName === './NativeSafeAreaProvider' &&
          context.originModulePath === path.join(safeAreaRoot, 'src/SafeAreaContext.tsx'))
      ) {
        return { type: 'sourceFile', filePath: adapter('react-native-safe-area-context-native.harmony.js') };
      }
    },
  });

  const serialize = harmony.serializer.customSerializer;
  harmony.serializer.customSerializer = async (entryPoint, preModules, graph, options) => {
    const result = await serialize(entryPoint, preModules, graph, options);
    if (graph.transformOptions.platform === 'harmony' && result.artifacts) {
      for (const artifact of result.artifacts) {
        if (artifact.type !== 'map') continue;
        const map = JSON.parse(artifact.source);
        // Metro's require.context modules have no file for Expo Harmony to relativize.
        map.sources = map.sources.map(source => source.replace(/^\/(.+\?ctx=[a-f0-9]+)$/u, '$1'));
        artifact.source = JSON.stringify(map);
      }
    }
    return result;
  };

  return require('@react-native-ohos/nativewind/metro').withNativeWind(harmony, {
    input: path.join(repositoryRoot, 'global.css'),
    configPath: path.join(projectRoot, 'tailwind.config.js'),
  });
}

if (process.env.EXPO_METRO_TARGET === 'harmony') {
  module.exports = withHarmony(config);
} else {
  // https://github.com/expo/expo/issues/43614#issuecomment-3992041354
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.includes('MaterialSymbols')) return { type: 'empty' };
    return context.resolveRequest(context, moduleName, platform);
  };
  module.exports = require('nativewind/metro').withNativeWind(config, { input: './global.css' });
}
