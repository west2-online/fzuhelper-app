import { AsyncStoragePackage } from '@react-native-ohos/async-storage';
import { ClipboardPackage } from '@react-native-ohos/clipboard';
import { BlobUtilPackage } from '@react-native-ohos/react-native-blob-util';
import { RTNCameraKitPackage } from '@react-native-ohos/react-native-camera-kit';
import RNDeviceInfoPackage from '@react-native-ohos/react-native-device-info';
import GestureHandlerPackage from '@react-native-ohos/react-native-gesture-handler';
import { ImageCropPickerPackage } from '@react-native-ohos/react-native-image-crop-picker';
import {
  RNKeyboardControllerPackage,
  RNStatusBarManagerCompatPackage,
} from '@react-native-ohos/react-native-keyboard-controller';
import { PermissionsPackage } from '@react-native-ohos/react-native-permissions';
import { ReanimatedPackage } from '@react-native-ohos/react-native-reanimated';
import { SafeAreaViewPackage } from '@react-native-ohos/react-native-safe-area-context';
import RNOHScreensPackage from '@react-native-ohos/react-native-screens';
import { SplashScreenPackage } from '@react-native-ohos/react-native-splash-screen/ts';
import { SvgPackage } from '@react-native-ohos/react-native-svg';
import { WebViewPackage } from '@react-native-ohos/react-native-webview';
import { ReanimatedWorkletPackage } from '@react-native-ohos/react-native-worklets';
import { CookiesPackage } from '@react-native-ohos/cookies';
import GeoLocationPackage from '@react-native-ohos/geolocation';
import { ExpoQuickActionsPackage } from 'expo_quick_actions';
import type { RNPackage, RNPackageContext } from '@rnoh/react-native-openharmony';
import { FzuHelperPackage } from './FzuHelperPackage';

export function getRNOHPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new ReanimatedWorkletPackage(ctx),
    new ReanimatedPackage(ctx),
    new AsyncStoragePackage(ctx),
    new BlobUtilPackage(ctx),
    new ClipboardPackage(ctx),
    new CookiesPackage(ctx),
    new GeoLocationPackage(ctx),
    new GestureHandlerPackage(ctx),
    new ImageCropPickerPackage(ctx),
    new PermissionsPackage(ctx),
    new RNDeviceInfoPackage(ctx),
    new RNKeyboardControllerPackage(ctx),
    new RNStatusBarManagerCompatPackage(ctx),
    new RTNCameraKitPackage(ctx),
    new SafeAreaViewPackage(ctx),
    new RNOHScreensPackage(ctx),
    new SplashScreenPackage(ctx),
    new SvgPackage(ctx),
    new WebViewPackage(ctx),
    new ExpoQuickActionsPackage(ctx),
    new FzuHelperPackage(ctx),
  ];
}
