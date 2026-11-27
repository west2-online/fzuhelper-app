import { preferences } from '@kit.ArkData';

const SHOW_LAST_UPDATE_TIME_SUFFIX: string = ':show_last_update_time';
const SHOW_REMARKS_SUFFIX: string = ':show_remarks';
const PREVIEW_TOMORROW_SUFFIX: string = ':preview_tomorrow';

export interface WidgetConfig {
  showRemarks: boolean;
  previewTomorrow: boolean;
}

export function readWidgetConfig(store: preferences.Preferences, formId: string): WidgetConfig {
  const showRemarks = store.getSync(configKey(formId, SHOW_REMARKS_SUFFIX), true) as boolean;
  const previewTomorrow = store.getSync(configKey(formId, PREVIEW_TOMORROW_SUFFIX), false) as boolean;
  return { showRemarks, previewTomorrow };
}

export function putShowRemarks(
  store: preferences.Preferences,
  formId: string,
  value: boolean,
): void {
  store.putSync(configKey(formId, SHOW_REMARKS_SUFFIX), value);
}

export function putPreviewTomorrow(
  store: preferences.Preferences,
  formId: string,
  value: boolean,
): void {
  store.putSync(configKey(formId, PREVIEW_TOMORROW_SUFFIX), value);
}

export function deleteWidgetConfig(store: preferences.Preferences, formId: string): void {
  store.deleteSync(configKey(formId, SHOW_REMARKS_SUFFIX));
  store.deleteSync(configKey(formId, PREVIEW_TOMORROW_SUFFIX));
  store.deleteSync(configKey(formId, SHOW_LAST_UPDATE_TIME_SUFFIX));
}

function configKey(formId: string, suffix: string): string {
  return `${formId}${suffix}`;
}
