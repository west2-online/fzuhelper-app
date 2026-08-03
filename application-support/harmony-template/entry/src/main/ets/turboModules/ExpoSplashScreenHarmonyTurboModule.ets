import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';
import { HarmonySplashScreen } from '../splash/HarmonySplashScreen';

export class ExpoSplashScreenHarmonyTurboModule extends EtsUITurboModule {
  static readonly NAME: string = 'ExpoSplashScreenHarmony';

  hide(): void {
    HarmonySplashScreen.hide().catch((error: Error) => {
      console.error(`Failed to hide the HarmonyOS splash screen: ${error.message}`);
    });
  }
}
