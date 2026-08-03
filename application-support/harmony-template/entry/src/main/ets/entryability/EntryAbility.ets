import { AbilityConstant, Want } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { ExpoQuickActionsLaunchState } from 'expo_quick_actions';
import { PushAgent } from '@umeng/push';
import { RNAbility } from '@rnoh/react-native-openharmony';
import { HarmonySplashScreen } from '../splash/HarmonySplashScreen';
import { HarmonyPushTurboModule } from '../turboModules/HarmonyPushTurboModule';

export default class EntryAbility extends RNAbility {
  override onCreate(want: Want, launchParam?: AbilityConstant.LaunchParam): void {
    PushAgent.initCallback((data: Record<string, string>) => {
      HarmonyPushTurboModule.onInitCallback(data);
    });
    ExpoQuickActionsLaunchState.recordInitial(want);
    super.onCreate(want, launchParam);
  }

  override onNewWant(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    ExpoQuickActionsLaunchState.record(want);
    super.onNewWant(want, launchParam);
  }

  override getPagePath(): string {
    return 'pages/Index';
  }

  override onWindowStageCreate(windowStage: window.WindowStage): void {
    HarmonySplashScreen.show(
      this.context,
      windowStage,
      $r('app.media.start_icon'),
      '#FFFFFF',
      'pages/SplashScreenPage',
    ).then(() => {
      super.onWindowStageCreate(windowStage);
    }).catch(() => {
      // The React Native surface must still be created if the optional
      // splash subwindow cannot be shown on a particular device.
      super.onWindowStageCreate(windowStage);
    });
  }

  override getRNOHWorkerScriptUrl(): string {
    return 'entry/ets/workers/RNOHWorker.ets';
  }
}
