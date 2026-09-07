import { window } from '@kit.ArkUI';
import { ExpoModule, ExpoModuleDefinition, ExpoFunction, ExpoValueTypes, ExpoRecordShape } from '@expo-harmony/expo-modules-core';

export class NativeBrightnessModule extends ExpoModule {
  override definition(): ExpoModuleDefinition {
    return new ExpoModuleDefinition().name('NativeBrightness')
      .asyncFunction('enableHighBrightness', async (): Promise<void> => this.context.runOnUIQueue(() => this.enableHighBrightness()))
      .asyncFunction('disableHighBrightness', async (): Promise<void> => this.context.runOnUIQueue(() => this.disableHighBrightness()));
  }
  private previousBrightness: number | undefined = undefined;

  async enableHighBrightness(): Promise<void> {
    const appWindow = await window.getLastWindow(this.context.uiAbilityContext);
    if (this.previousBrightness === undefined) {
      this.previousBrightness = appWindow.getWindowProperties().brightness;
    }
    await appWindow.setWindowKeepScreenOn(true);
    await appWindow.setWindowBrightness(1);
  }

  async disableHighBrightness(): Promise<void> {
    const appWindow = await window.getLastWindow(this.context.uiAbilityContext);
    await appWindow.setWindowBrightness(this.previousBrightness ?? -1);
    await appWindow.setWindowKeepScreenOn(false);
    this.previousBrightness = undefined;
  }
}
