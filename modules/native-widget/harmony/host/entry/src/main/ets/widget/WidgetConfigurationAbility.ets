import { UIAbility, Want } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { formInfo } from '@kit.FormKit';

export const WIDGET_CONFIG_FORM_ID: string = 'widget_config_form_id';

export default class WidgetConfigurationAbility extends UIAbility {
  onCreate(want: Want): void {
    const formIdValue = want.parameters?.[formInfo.FormParam.IDENTITY_KEY];
    AppStorage.setOrCreate(WIDGET_CONFIG_FORM_ID, formIdValue === undefined ? '' : `${formIdValue}`);
  }

  onNewWant(want: Want): void {
    const formIdValue = want.parameters?.[formInfo.FormParam.IDENTITY_KEY];
    AppStorage.set(WIDGET_CONFIG_FORM_ID, formIdValue === undefined ? '' : `${formIdValue}`);
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/WidgetConfigurationPage');
  }
}
