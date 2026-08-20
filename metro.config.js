const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withHarmonyConfig } = require('@expo-harmony/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const isHarmony = process.env.EXPO_METRO_TARGET === 'harmony';
const adapter = name => path.join(projectRoot, 'application-support', 'harmony-adapters', name);
const mock = name => path.join(projectRoot, 'application-support', 'harmony-mocks', name);
const projectImportRoots = ['api', 'app', 'components', 'context', 'hooks', 'lib', 'modules', 'utils'];
const harmonyReactPackage = 'react-harmony';

const expoNavigationBarPackageRoot = path.dirname(require.resolve('expo-navigation-bar/package.json'));
const expoNavigationBarAndroid = path.join(expoNavigationBarPackageRoot, 'build', 'NavigationBar.android.js');
const expoNavigationBarNativeModule = path.join(expoNavigationBarPackageRoot, 'build', 'ExpoNavigationBar.android.js');
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

const redirects = new Map([
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
  [
    '@/components/toolbox-icons',
    {
      type: 'sourceFile',
      filePath: path.join(projectRoot, 'components', 'toolbox-icons.harmony.tsx'),
    },
  ],
]);

let config = getDefaultConfig(projectRoot);
const { transformer, resolver } = config;

config = {
  ...config,
  transformer: {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  },
  resolver: {
    ...resolver,
    assetExts: resolver.assetExts.filter(extension => extension !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
    // https://github.com/expo/expo/issues/43614#issuecomment-3992041354
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.includes('MaterialSymbols')) {
        return { type: 'empty' };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

config = withHarmonyConfig(config, {
  enabled: isHarmony,
  projectRoot,
  env: { IS_HARMONY: 'true' },
  aliases: {
    '@': projectRoot,
    ...Object.fromEntries(projectImportRoots.map(name => [name, path.join(projectRoot, name)])),
    react: harmonyReactPackage,
  },
  redirects,
  emptyModules: [/MaterialSymbols/u],
  resolveRequest({ context, moduleName }) {
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

    if (/^react-native-safe-area-context\/src\/+InitialWindow$/u.test(moduleName)) {
      return {
        type: 'sourceFile',
        filePath: adapter('react-native-safe-area-context-initial-window.harmony.js'),
      };
    }
  },
});

module.exports = withNativeWind(config, { input: './global.css' });
