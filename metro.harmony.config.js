'use strict';

const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const { createHarmonyMetroConfig } = require('@react-native-oh/react-native-harmony/metro.config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const projectImportRoots = new Set(['api', 'app', 'components', 'context', 'hooks', 'lib', 'modules', 'utils']);
const harmonyReactPackage = 'react-harmony';
const adapter = name => path.join(projectRoot, '__harmony_adapters__', name);
const mock = name => path.join(projectRoot, '__mocks__', name);
const expoNavigationBarAndroid = path.join(
  path.dirname(require.resolve('expo-navigation-bar/package.json')),
  'build',
  'NavigationBar.android.js',
);
const expoNavigationBarNativeModule = path.join(
  path.dirname(require.resolve('expo-navigation-bar/package.json')),
  'build',
  'ExpoNavigationBar.android.js',
);
const expoSplashScreenNative = path.join(
  path.dirname(require.resolve('expo-splash-screen/package.json')),
  'build',
  'SplashScreen.native.js',
);
const harmonyWorkletsPackageJson = path.join(
  path.dirname(require.resolve('@react-native-ohos/react-native-worklets/package.json')),
  'node_modules',
  'react-native-worklets',
  'package.json',
);

const packageRedirects = new Map([
  ['expo-blur', adapter('expo-blur.harmony.js')],
  ['expo-camera', adapter('expo-camera.harmony.js')],
  ['expo-crypto', adapter('expo-crypto.harmony.js')],
  ['expo-file-system/legacy', adapter('expo-file-system.harmony.js')],
  ['expo-linear-gradient', adapter('expo-linear-gradient.harmony.js')],
  ['expo-navigation-bar', expoNavigationBarAndroid],
  ['expo-status-bar', adapter('expo-status-bar.harmony.js')],
  ['@preeternal/react-native-cookie-manager', adapter('cookie-manager.harmony.js')],
  ['react-native-keyboard-controller', adapter('react-native-keyboard-controller.harmony.js')],
  ['react-native-safe-area-context', adapter('react-native-safe-area-context.harmony.js')],
  ['react-native-screens/experimental', mock('react-native-screens-experimental.harmony.js')],
  // Reanimated 4.2.1 checks this subpath at runtime. The Harmony wrapper is
  // versioned 1.0.0, but the JS implementation it embeds (and its native HAR)
  // is Worklets 0.7.1. Point the check at that implementation's manifest.
  ['react-native-worklets/package.json', harmonyWorkletsPackageJson],
]);

const expoConfig = getDefaultConfig(projectRoot);
const expoResolveRequest = expoConfig.resolver.resolveRequest;
const harmonyConfig = createHarmonyMetroConfig({
  reactNativeHarmonyPackageName: '@react-native-oh/react-native-harmony',
});
const config = mergeConfig(expoConfig, harmonyConfig);

const harmonyResolveRequest = config.resolver.resolveRequest;
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter(extension => extension !== 'svg'),
  sourceExts: [...new Set([...config.resolver.sourceExts, 'svg'])],
  unstable_conditionsByPlatform: {
    ...config.resolver.unstable_conditionsByPlatform,
    harmony: ['react-native'],
  },
  resolveRequest(context, moduleName, platform) {
    if (platform !== 'harmony') {
      return expoResolveRequest
        ? expoResolveRequest(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
    }

    if (moduleName.includes('MaterialSymbols')) {
      return { type: 'empty' };
    }

    if (moduleName.startsWith('@/')) {
      return context.resolveRequest(context, path.join(projectRoot, moduleName.slice(2)), platform);
    }

    if (projectImportRoots.has(moduleName.split('/')[0])) {
      return context.resolveRequest(context, path.join(projectRoot, moduleName), platform);
    }

    // RNOH 0.82's renderer is built against React 19.1.1, whereas the main
    // RN 0.85 app uses React 19.2.3. Keep one platform-specific React instance
    // and redirect its JSX/compiler runtime subpaths along with the root import.
    if (moduleName === 'react' || moduleName.startsWith('react/')) {
      return context.resolveRequest(context, moduleName.replace(/^react(?=\/|$)/u, harmonyReactPackage), platform);
    }

    if (/^react-native-safe-area-context\/src\/+InitialWindow$/u.test(moduleName)) {
      return {
        type: 'sourceFile',
        filePath: adapter('react-native-safe-area-context-initial-window.harmony.js'),
      };
    }

    const redirected = packageRedirects.get(moduleName);
    if (redirected) {
      return { type: 'sourceFile', filePath: redirected };
    }

    if (
      moduleName === './ExpoNavigationBar' &&
      context.originModulePath.includes(`${path.sep}expo-navigation-bar${path.sep}`)
    ) {
      return { type: 'sourceFile', filePath: expoNavigationBarNativeModule };
    }

    if (
      moduleName === './SplashScreen' &&
      context.originModulePath.includes(`${path.sep}expo-splash-screen${path.sep}`)
    ) {
      return { type: 'sourceFile', filePath: expoSplashScreenNative };
    }

    // RNOH owns platform/library redirection, while Expo's resolver must remain
    // the terminal resolver so tsconfig paths such as "@/..." keep working.
    const harmonyContext = expoResolveRequest ? { ...context, resolveRequest: expoResolveRequest } : context;
    return harmonyResolveRequest(harmonyContext, moduleName, platform);
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
