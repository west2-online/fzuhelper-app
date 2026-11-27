import { UIAbility, Want } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';

export const WIDGET_CONFIG_FORM_ID: string = 'widget_config_form_id';

export default class WidgetConfigurationAbility extends UIAbility {
  onCreate(want: Want): void {
    this.setFormId(want);
  }

  onNewWant(want: Want): void {
    this.setFormId(want);
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/WidgetConfigurationPage');
  }

  private setFormId(want: Want): void {
    const formId = want.parameters?.formId as string | undefined;
    AppStorage.setOrCreate(WIDGET_CONFIG_FORM_ID, formId ?? '');
  }
}
