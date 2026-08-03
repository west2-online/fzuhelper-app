import { window } from '@kit.ArkUI';
import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';

export class NativeBrightnessTurboModule extends EtsUITurboModule {
  static readonly NAME: string = 'NativeBrightness';
  private previousBrightness: number | undefined = undefined;

  async enableHighBrightness(): Promise<void> {
    const appWindow = await window.getLastWindow(this.ctx.uiAbilityContext);
    if (this.previousBrightness === undefined) {
      this.previousBrightness = appWindow.getWindowProperties().brightness;
    }
    await appWindow.setWindowKeepScreenOn(true);
    await appWindow.setWindowBrightness(1);
  }

  async disableHighBrightness(): Promise<void> {
    const appWindow = await window.getLastWindow(this.ctx.uiAbilityContext);
    await appWindow.setWindowBrightness(this.previousBrightness ?? -1);
    await appWindow.setWindowKeepScreenOn(false);
    this.previousBrightness = undefined;
  }
}
