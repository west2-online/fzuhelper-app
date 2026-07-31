import { shortcutManager } from '@kit.AbilityKit';
import { deviceInfo } from '@kit.BasicServicesKit';
import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';
import { UITurboModuleContext } from '@rnoh/react-native-openharmony';
import {
  ExpoQuickActionsLaunchState,
  QUICK_ACTION_EVENT,
} from './ExpoQuickActionsLaunchState';

const RUNTIME_VISIBILITY_API_LEVEL: number = 20;

export class ExpoQuickActionsTurboModule extends EtsUITurboModule {
  static readonly NAME: string = 'ExpoQuickActionsHarmony';

  constructor(ctx: UITurboModuleContext) {
    super(ctx);
    ExpoQuickActionsLaunchState.setListener((serializedAction: string) => {
      this.ctx.rnInstance.emitDeviceEvent(QUICK_ACTION_EVENT, serializedAction);
    });
  }

  getInitialAction(): string {
    return ExpoQuickActionsLaunchState.getInitial();
  }

  startObserving(): void {
    ExpoQuickActionsLaunchState.startObserving();
  }

  stopObserving(): void {
    ExpoQuickActionsLaunchState.stopObserving();
  }

  async setItems(ids: string[], managedIds: string[]): Promise<boolean> {
    if (deviceInfo.sdkApiVersion < RUNTIME_VISIBILITY_API_LEVEL) {
      return false;
    }

    const shortcuts = await shortcutManager.getAllShortcutInfoForSelf();
    const configuredIds = shortcuts.map(shortcut => shortcut.id);
    for (let index = 0; index < managedIds.length; index += 1) {
      if (!configuredIds.includes(managedIds[index])) {
        throw new Error(
          `Shortcut "${managedIds[index]}" is not declared by the HarmonyOS application`,
        );
      }
    }

    for (let index = 0; index < shortcuts.length; index += 1) {
      const shortcut = shortcuts[index];
      if (!managedIds.includes(shortcut.id)) {
        continue;
      }
      const visible = ids.includes(shortcut.id);
      if (shortcut.visible !== visible) {
        await shortcutManager.setShortcutVisibleForSelf(shortcut.id, visible);
      }
    }
    return true;
  }
}
