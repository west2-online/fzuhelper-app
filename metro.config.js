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
  const { withHarmonyConfig } = require('@expo-harmony/metro-config');
  const adapter = name => path.join(repositoryRoot, 'application-support/harmony-adapters', name);
  const workletsRoot = path.dirname(require.resolve('@react-native-ohos/react-native-worklets/package.json'));
  const quickActionsRoot = path.dirname(require.resolve('expo-quick-actions/package.json'));
  const nativeWindRoot = path.dirname(require.resolve('@react-native-ohos/nativewind/package.json'));
  const safeAreaRoot = path.dirname(require.resolve('react-native-safe-area-context/package.json'));
  const nativeWindRequire = createRequire(path.join(nativeWindRoot, 'package.json'));
  const cssInteropRoot = path.dirname(nativeWindRequire.resolve('react-native-css-interop/package.json'));

  // Harmony's ports forward to the upstream versions matching their native HARs.
  const resolveBase = config.resolver.resolveRequest;
  const screensRoot = path.dirname(require.resolve('react-native-screens-harmony/package.json'));
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    let target = moduleName;
    if (/^react-native-screens(?:\/|$)/u.test(moduleName)) {
      target = moduleName.replace('react-native-screens', screensRoot);
    } else if (
      /^react-native-worklets(?:\/|$)/u.test(moduleName) &&
      context.originModulePath.startsWith(workletsRoot + path.sep)
    ) {
      target = moduleName.replace(
        'react-native-worklets',
        path.join(workletsRoot, 'node_modules/react-native-worklets'),
      );
    }
    return resolveBase ? resolveBase(context, target, platform) : context.resolveRequest(context, target, platform);
  };

  const harmony = withHarmonyConfig(config, {
    projectRoot,
    env: { IS_HARMONY: 'true' },
    aliases: {
      '@': repositoryRoot,
      ...Object.fromEntries(
        ['api', 'app', 'components', 'context', 'hooks', 'lib', 'modules', 'utils'].map(name => [
          name,
          path.join(repositoryRoot, name),
        ]),
      ),
      react: 'react-harmony',
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
      'react-native-worklets/package.json': path.join(workletsRoot, 'node_modules/react-native-worklets/package.json'),
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

  return require('@react-native-ohos/nativewind/metro').withNativeWind(harmony, {
    input: path.join(repositoryRoot, 'global.css'),
    configPath: path.join(projectRoot, 'tailwind.config.js'),
  });
}

if (process.env.EXPO_HARMONY === '1') {
  module.exports = withHarmony(config);
} else {
  // https://github.com/expo/expo/issues/43614#issuecomment-3992041354
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.includes('MaterialSymbols')) return { type: 'empty' };
    return context.resolveRequest(context, moduleName, platform);
  };
  module.exports = require('nativewind/metro').withNativeWind(config, { input: './global.css' });
}
