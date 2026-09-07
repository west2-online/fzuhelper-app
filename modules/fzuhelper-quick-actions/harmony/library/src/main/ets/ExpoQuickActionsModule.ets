import { shortcutManager, Want } from '@kit.AbilityKit';
import { deviceInfo } from '@kit.BasicServicesKit';
import { util } from '@kit.ArkTS';
import {
  ExpoFunction, ExpoModule, ExpoModuleDefinition, ExpoModuleError,
  ExpoRecordShape, ExpoValueTypes,
} from '@expo-harmony/expo-modules-core';

type ActionParam = string | number | boolean | null;

interface QuickAction {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  params?: Record<string, ActionParam>;
}

const ACTION_PARAMETER_KEY: string = 'expo.modules.quickactions.SHORTCUT';
const MAX_SHORTCUT_COUNT: number = 4;

function readAction(want?: Want): QuickAction | null {
  const serialized = want?.parameters?.[ACTION_PARAMETER_KEY];
  if (typeof serialized !== 'string' || serialized.length === 0) return null;
  try {
    const action = JSON.parse(serialized) as QuickAction;
    if (action && typeof action.id === 'string' && typeof action.title === 'string') return action;
  } catch (_) {}
  return null;
}

function comparableAction(action: QuickAction): string {
  const params: Record<string, ActionParam> = {};
  Object.keys(action.params ?? params).sort().forEach((key: string): void => {
    params[key] = action.params![key];
  });
  const values: ESObject[] = [action.id, action.title, action.subtitle ?? null,
    action.icon ?? null, action.params == null ? null : params];
  return JSON.stringify(values);
}

export class ExpoQuickActionsModule extends ExpoModule {
  private observing: boolean = false;
  private pendingAction: QuickAction | null = null;
  private catalog?: QuickAction[];

  override definition(): ExpoModuleDefinition {
    const actionType = ExpoValueTypes.shapedRecord<QuickAction>('QuickAction', new ExpoRecordShape()
      .field('id', ExpoValueTypes.string())
      .field('title', ExpoValueTypes.string())
      .field('subtitle', ExpoValueTypes.string().optional())
      .field('icon', ExpoValueTypes.string().optional())
      .field('params', ExpoValueTypes.record(
        ExpoValueTypes.string().or(ExpoValueTypes.number()).or(ExpoValueTypes.boolean()).nullable(),
      ).optional()),
      (fields: Record<string, ESObject>): QuickAction => ({
        id: fields['id'] as string, title: fields['title'] as string,
        subtitle: fields['subtitle'] as string | undefined, icon: fields['icon'] as string | undefined,
        params: fields['params'] as Record<string, ActionParam> | undefined,
      }),
      (action: QuickAction): Record<string, ESObject> => {
        const fields: Record<string, ESObject> = {};
        fields['id'] = action.id;
        fields['title'] = action.title;
        fields['subtitle'] = action.subtitle;
        fields['icon'] = action.icon;
        fields['params'] = action.params;
        return fields;
      });

    return new ExpoModuleDefinition()
      .name('ExpoQuickActions')
      .constant('initial', (): QuickAction | null => readAction(this.context.initialWant))
      .constant('maxCount', MAX_SHORTCUT_COUNT)
      .events(['onQuickAction'])
      .asyncFunction('isSupported', async (): Promise<boolean> => true)
      .asyncFunction('setItems', ExpoFunction.typed1(ExpoValueTypes.array(actionType).nullable().optional(),
        async (items: QuickAction[] | null | undefined): Promise<void> => this.setItems(items ?? [])))
      .onNewWant((want: Want): void => {
        const action = readAction(want);
        if (!action) return;
        if (this.observing) this.sendEvent('onQuickAction', action);
        else this.pendingAction = action;
      })
      .onStartObserving((_event: string): void => {
        this.observing = true;
        if (this.pendingAction) {
          const action = this.pendingAction;
          this.pendingAction = null;
          this.sendEvent('onQuickAction', action);
        }
      })
      .onStopObserving((_event: string): void => { this.observing = false; })
      .onDestroy((): void => { this.observing = false; this.pendingAction = null; });
  }

  private getCatalog(): QuickAction[] {
    if (!this.catalog) {
      const bytes = this.context.uiAbilityContext.resourceManager.getRawFileContentSync('expo-quick-actions.json');
      this.catalog = JSON.parse(util.TextDecoder.create('utf-8').decodeToString(bytes)) as QuickAction[];
    }
    return this.catalog;
  }

  private async setItems(items: QuickAction[]): Promise<void> {
    if (items.length > MAX_SHORTCUT_COUNT) {
      throw new ExpoModuleError('ERR_QUICK_ACTION_COUNT', 'HarmonyOS supports at most four launcher shortcuts.');
    }
    const catalog = this.getCatalog();
    const ids: string[] = [];
    for (const item of items) {
      const declared = catalog.find((action: QuickAction): boolean => action.id === item.id);
      if (ids.includes(item.id) || !declared || comparableAction(item) !== comparableAction(declared)) {
        throw new ExpoModuleError('ERR_QUICK_ACTION_CONFIG',
          `Shortcut "${item.id}" must match its build-time declaration and cannot be repeated.`);
      }
      ids.push(item.id);
    }
    if (deviceInfo.sdkApiVersion < 20) {
      if (ids.length !== catalog.length) {
        throw new ExpoModuleError('ERR_QUICK_ACTION_API', 'Changing shortcut visibility requires HarmonyOS API 20.');
      }
      return;
    }
    await this.context.runOnUIQueue(async (): Promise<void> => {
      const shortcuts = await shortcutManager.getAllShortcutInfoForSelf();
      for (const action of catalog) {
        const shortcut = shortcuts.find((value: shortcutManager.ShortcutInfo): boolean => value.id === action.id);
        if (!shortcut) {
          throw new ExpoModuleError('ERR_QUICK_ACTION_CONFIG', `Shortcut "${action.id}" is not declared by the application.`);
        }
        const visible = ids.includes(action.id);
        if (shortcut.visible !== visible) await shortcutManager.setShortcutVisibleForSelf(action.id, visible);
      }
    });
  }
}
