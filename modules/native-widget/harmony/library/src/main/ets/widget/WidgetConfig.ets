import { preferences } from '@kit.ArkData';

const SHOW_LAST_UPDATE_TIME_SUFFIX: string = ':show_last_update_time';
const SHOW_AS_SQUARE_SUFFIX: string = ':show_as_square';
const FORM_WIDTH_SUFFIX: string = ':form_width';
const FORM_HEIGHT_SUFFIX: string = ':form_height';

export interface WidgetConfig {
  showLastUpdateTime: boolean;
  showAsSquare: boolean;
  width: number;
  height: number;
  verticalInset: number;
}

export function readWidgetConfig(store: preferences.Preferences, formId: string): WidgetConfig {
  const showLastUpdateTime = store.getSync(configKey(formId, SHOW_LAST_UPDATE_TIME_SUFFIX), false) as boolean;
  const showAsSquare = store.getSync(configKey(formId, SHOW_AS_SQUARE_SUFFIX), false) as boolean;
  const width = store.getSync(configKey(formId, FORM_WIDTH_SUFFIX), 0) as number;
  const height = store.getSync(configKey(formId, FORM_HEIGHT_SUFFIX), 0) as number;
  return {
    showLastUpdateTime,
    showAsSquare,
    width,
    height,
    verticalInset: showAsSquare ? Math.max((height - width) / 2, 0) : 0,
  };
}

export function putShowLastUpdateTime(
  store: preferences.Preferences,
  formId: string,
  value: boolean,
): void {
  store.putSync(configKey(formId, SHOW_LAST_UPDATE_TIME_SUFFIX), value);
}

export function putShowAsSquare(
  store: preferences.Preferences,
  formId: string,
  value: boolean,
): void {
  store.putSync(configKey(formId, SHOW_AS_SQUARE_SUFFIX), value);
}

export function putFormMetrics(
  store: preferences.Preferences,
  formId: string,
  width: number | undefined,
  height: number | undefined,
): void {
  if (width !== undefined && Number.isFinite(width) && width > 0) {
    store.putSync(configKey(formId, FORM_WIDTH_SUFFIX), width);
  }
  if (height !== undefined && Number.isFinite(height) && height > 0) {
    store.putSync(configKey(formId, FORM_HEIGHT_SUFFIX), height);
  }
}

export function deleteWidgetConfig(store: preferences.Preferences, formId: string): void {
  store.deleteSync(configKey(formId, SHOW_LAST_UPDATE_TIME_SUFFIX));
  store.deleteSync(configKey(formId, SHOW_AS_SQUARE_SUFFIX));
  store.deleteSync(configKey(formId, FORM_WIDTH_SUFFIX));
  store.deleteSync(configKey(formId, FORM_HEIGHT_SUFFIX));
}

function configKey(formId: string, suffix: string): string {
  return `${formId}${suffix}`;
}
