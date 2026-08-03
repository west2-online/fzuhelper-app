import { image } from '@kit.ImageKit';
import { window } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { SplashScreen } from '@react-native-ohos/react-native-splash-screen/src/main/ets/SplashScreen';

export class HarmonySplashScreen {
  private static splashWindow: window.Window | undefined = undefined;
  private static showPromise: Promise<void> | undefined = undefined;
  private static hideRequested: boolean = false;

  static show(
    abilityContext: common.UIAbilityContext,
    windowStage: window.WindowStage,
    iconResource: Resource,
    backgroundColor: string,
    pageUrl: string,
  ): Promise<void> {
    if (HarmonySplashScreen.showPromise) {
      return HarmonySplashScreen.showPromise;
    }

    HarmonySplashScreen.hideRequested = false;
    HarmonySplashScreen.showPromise = HarmonySplashScreen.create(
      abilityContext,
      windowStage,
      iconResource,
      backgroundColor,
      pageUrl,
    );
    return HarmonySplashScreen.showPromise;
  }

  private static async create(
    abilityContext: common.UIAbilityContext,
    windowStage: window.WindowStage,
    iconResource: Resource,
    backgroundColor: string,
    pageUrl: string,
  ): Promise<void> {
    const fileData = await abilityContext.resourceManager.getMediaContent(iconResource);
    const imageSource = image.createImageSource(fileData.buffer);
    SplashScreen.startWindowIcon = await imageSource.createPixelMap();

    const splashWindow = await windowStage.createSubWindow('SplashScreenWindow');
    HarmonySplashScreen.splashWindow = splashWindow;
    await splashWindow.setFullScreen(true);
    await splashWindow.setUIContent(pageUrl);
    await splashWindow.setWindowBackgroundColor(backgroundColor);
    await splashWindow.showWindow();

    if (HarmonySplashScreen.hideRequested) {
      await HarmonySplashScreen.destroy();
    }
  }

  static async hide(): Promise<void> {
    HarmonySplashScreen.hideRequested = true;
    try {
      await HarmonySplashScreen.showPromise;
    } finally {
      await HarmonySplashScreen.destroy();
    }
  }

  private static async destroy(): Promise<void> {
    const splashWindow = HarmonySplashScreen.splashWindow;
    HarmonySplashScreen.splashWindow = undefined;
    if (splashWindow) {
      await splashWindow.destroyWindow();
    }
  }
}
