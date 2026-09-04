import { preferences } from '@kit.ArkData';
import { formBindingData, formProvider } from '@kit.FormKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';
import {
  buildWidgetBindingData,
  WIDGET_DATA_KEY,
  WIDGET_FORM_IDS_KEY,
  WIDGET_STORE_NAME,
} from '../widget/WidgetData';
import { readWidgetConfig } from '../widget/WidgetConfig';
import { Want } from '@kit.AbilityKit';

export class NativeWidgetTurboModule extends EtsUITurboModule {
  static readonly NAME: string = 'NativeWidget';
  private static readonly FORM_ID_NOT_EXIST_ERROR_CODE: number = 16501001;

  async setWidgetData(json: string, packageName: string): Promise<void> {
    await this.updateWidgets(json);
  }

  async requestPinAppWidget(requestCode: number): Promise<number> {
    const want: Want = {
      bundleName: "com.west2online.fzuhelper.next",
      abilityName: 'EntryAbility',
      parameters: {
        'ohos.extra.param.key.form_dimension': 2,
        'ohos.extra.param.key.form_name': 'NextClassCard',
        'ohos.extra.param.key.module_name': 'entry'
      },
    };
    try {
      // 点击按钮后调用openFormManager方法，拉起卡片管理页面
      formProvider.openFormManager(want);
      return 1;
    } catch (error) {
      return 0;
    }
  }

  private async updateWidgets(json: string): Promise<void> {
    const store = await preferences.getPreferences(this.ctx.uiAbilityContext, WIDGET_STORE_NAME);
    await store.put(WIDGET_DATA_KEY, json);
    await store.flush();
    const formIds = await store.get(WIDGET_FORM_IDS_KEY, []) as string[];
    const retainedFormIds: string[] = [];
    const updateErrors: string[] = [];
    for (let index = 0; index < formIds.length; index += 1) {
      const formId = formIds[index];
      try {
        const config = readWidgetConfig(store, formId);
        const data = formBindingData.createFormBindingData(
          buildWidgetBindingData(json, config.showLastUpdateTime, config.verticalInset),
        );
        await formProvider.updateForm(formId, data);
        retainedFormIds.push(formId);
      } catch (error) {
        // The launcher can remove a form before onRemoveForm is delivered.
        // Remove only confirmed stale IDs. Other failures must remain visible
        // to JavaScript without preventing the remaining forms from updating.
        const businessError = error as BusinessError;
        if (businessError.code !== NativeWidgetTurboModule.FORM_ID_NOT_EXIST_ERROR_CODE) {
          retainedFormIds.push(formId);
          updateErrors.push(`Form ${formId}: ${this.errorMessage(error)}`);
        }
      }
    }

    if (retainedFormIds.length !== formIds.length) {
      await store.put(WIDGET_FORM_IDS_KEY, retainedFormIds);
      await store.flush();
    }
    if (updateErrors.length > 0) {
      throw new Error(`Failed to update HarmonyOS widgets: ${updateErrors.join('; ')}`);
    }
  }

  private errorMessage(error: Object): string {
    return error instanceof Error ? error.message : `${error}`;
  }
}
