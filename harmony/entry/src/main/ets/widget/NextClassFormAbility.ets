import { Want } from '@kit.AbilityKit';
import { preferences } from '@kit.ArkData';
import { BusinessError } from '@kit.BasicServicesKit';
import { formBindingData, FormExtensionAbility, formInfo, formProvider } from '@kit.FormKit';
import {
  buildWidgetBindingData,
  WIDGET_DATA_KEY,
  WIDGET_FORM_IDS_KEY,
  WIDGET_STORE_NAME,
} from './WidgetData';

export default class NextClassFormAbility extends FormExtensionAbility {
  private static readonly FORM_ID_NOT_EXIST_ERROR_CODE: number = 16501001;

  onAddForm(want: Want): formBindingData.FormBindingData {
    const store = preferences.getPreferencesSync(this.context, { name: WIDGET_STORE_NAME });
    const formIdValue = want.parameters?.[formInfo.FormParam.IDENTITY_KEY];
    const formId = formIdValue === undefined ? '' : `${formIdValue}`;
    const formIds = store.getSync(WIDGET_FORM_IDS_KEY, []) as string[];
    if (formId.length > 0 && !formIds.includes(formId)) {
      formIds.push(formId);
      store.putSync(WIDGET_FORM_IDS_KEY, formIds);
      store.flush().catch((error: Error) => {
        console.error(`Failed to persist HarmonyOS widget ID: ${error.message}`);
      });
    }
    const value = store.getSync(WIDGET_DATA_KEY, '');
    const json = typeof value === 'string' ? value : '';
    return formBindingData.createFormBindingData(buildWidgetBindingData(json));
  }

  onUpdateForm(formId: string): void {
    this.updateForm(formId);
  }

  onRemoveForm(formId: string): void {
    this.removeStoredFormId(formId);
  }

  onAcquireFormState(want: Want): formInfo.FormState {
    return formInfo.FormState.READY;
  }

  private async updateForm(formId: string): Promise<void> {
    const store = preferences.getPreferencesSync(this.context, { name: WIDGET_STORE_NAME });
    const value = store.getSync(WIDGET_DATA_KEY, '');
    const json = typeof value === 'string' ? value : '';
    try {
      await formProvider.updateForm(
        formId,
        formBindingData.createFormBindingData(buildWidgetBindingData(json)),
      );
    } catch (error) {
      const businessError = error as BusinessError;
      if (businessError.code === NextClassFormAbility.FORM_ID_NOT_EXIST_ERROR_CODE) {
        this.removeStoredFormId(formId);
      } else {
        const message = error instanceof Error ? error.message : `${error}`;
        console.error(`Failed to update HarmonyOS widget ${formId}: ${message}`);
      }
    }
  }

  private removeStoredFormId(formId: string): void {
    const store = preferences.getPreferencesSync(this.context, { name: WIDGET_STORE_NAME });
    const formIds = store.getSync(WIDGET_FORM_IDS_KEY, []) as string[];
    const retained: string[] = [];
    for (let index = 0; index < formIds.length; index += 1) {
      if (formIds[index] !== formId) {
        retained.push(formIds[index]);
      }
    }
    store.putSync(WIDGET_FORM_IDS_KEY, retained);
    store.flush().catch((error: Error) => {
      console.error(`Failed to remove HarmonyOS widget ID ${formId}: ${error.message}`);
    });
  }
}
