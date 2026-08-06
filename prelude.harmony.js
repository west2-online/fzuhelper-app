'use strict';

// Keep these requires ordered. Static imports are hoisted and can evaluate Expo
// before the JS implementation of globalThis.expo has been installed.

require('./application-support/harmony-polyfill/install-expo-polyfill.harmony');

const { installExpoAsset } = require('./modules/expo-asset/src/install.harmony');
installExpoAsset();

const harmonyExpoConfig = require('./application-support/harmony-polyfill/expo-config.generated.json');
const { installExpoConstants } = require('./modules/expo-constants/src/install.harmony');
installExpoConstants(harmonyExpoConfig);

const { installExpoLinking } = require('./modules/expo-linking/src/install.harmony');
installExpoLinking();

const { installExpoNavigationBar } = require('./modules/expo-navigation-bar/src/install.harmony');
installExpoNavigationBar();

const { installExpoSharing } = require('./modules/expo-sharing/src/install.harmony');
installExpoSharing();

const { installExpoSplashScreen } = require('./modules/expo-splash-screen/src/install.harmony');
installExpoSplashScreen();

const { getQuickActionItems } = require('./config/quick-actions');
const { installExpoQuickActions } = require('./modules/expo-quick-actions/src/install.harmony');
installExpoQuickActions(getQuickActionItems('harmony'));

const { enableScreens } = require('react-native-screens');
enableScreens(false);
