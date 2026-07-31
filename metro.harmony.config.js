'use strict';

const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const { createHarmonyMetroConfig } = require('@react-native-oh/react-native-harmony/metro.config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const projectImportRoots = new Set(['api', 'app', 'components', 'context', 'hooks', 'lib', 'modules', 'utils']);
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

const packageRedirects = new Map([
  ['expo-blur', adapter('expo-blur.harmony.js')],
  ['expo-camera', adapter('expo-camera.harmony.js')],
  ['expo-crypto', adapter('expo-crypto.harmony.js')],
  ['expo-file-system/legacy', adapter('expo-file-system.harmony.js')],
  ['expo-linear-gradient', adapter('expo-linear-gradient.harmony.js')],
  ['expo-navigation-bar', expoNavigationBarAndroid],
  ['expo-status-bar', adapter('expo-status-bar.harmony.js')],
  ['@preeternal/react-native-cookie-manager', adapter('cookie-manager.harmony.js')],
  ['react-native-screens/experimental', mock('react-native-screens-experimental.harmony.js')],
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
