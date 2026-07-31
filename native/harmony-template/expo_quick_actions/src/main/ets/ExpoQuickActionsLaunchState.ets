import { Want } from '@kit.AbilityKit';

const ACTION_PARAMETER_KEY: string = 'expo.modules.quickactions.SHORTCUT';
export const QUICK_ACTION_EVENT: string = 'ExpoQuickActions.onQuickAction';

type QuickActionListener = (serializedAction: string) => void;

export class ExpoQuickActionsLaunchState {
  private static initialAction: string = '';
  private static pendingEvent: string = '';
  private static listener: QuickActionListener | undefined = undefined;
  private static observing: boolean = false;

  private static read(want: Want): string {
    const serializedAction = want.parameters?.[ACTION_PARAMETER_KEY];
    if (typeof serializedAction !== 'string' || serializedAction.length === 0) {
      return '';
    }
    return serializedAction;
  }

  static recordInitial(want: Want): void {
    const serializedAction = ExpoQuickActionsLaunchState.read(want);
    if (serializedAction.length > 0) {
      ExpoQuickActionsLaunchState.initialAction = serializedAction;
    }
  }

  static record(want: Want): void {
    const serializedAction = ExpoQuickActionsLaunchState.read(want);
    if (serializedAction.length === 0) {
      return;
    }

    if (ExpoQuickActionsLaunchState.observing && ExpoQuickActionsLaunchState.listener) {
      ExpoQuickActionsLaunchState.listener(serializedAction);
      return;
    }
    ExpoQuickActionsLaunchState.pendingEvent = serializedAction;
  }

  static getInitial(): string {
    return ExpoQuickActionsLaunchState.initialAction;
  }

  static setListener(listener: QuickActionListener): void {
    ExpoQuickActionsLaunchState.listener = listener;
  }

  static startObserving(): void {
    ExpoQuickActionsLaunchState.observing = true;
    if (
      ExpoQuickActionsLaunchState.pendingEvent.length > 0 &&
      ExpoQuickActionsLaunchState.listener
    ) {
      const pendingEvent = ExpoQuickActionsLaunchState.pendingEvent;
      ExpoQuickActionsLaunchState.pendingEvent = '';
      ExpoQuickActionsLaunchState.listener(pendingEvent);
    }
  }

  static stopObserving(): void {
    ExpoQuickActionsLaunchState.observing = false;
  }
}
