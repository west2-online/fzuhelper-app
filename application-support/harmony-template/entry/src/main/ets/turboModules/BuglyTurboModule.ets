import { bundleManager } from '@kit.AbilityKit';
import { preferences } from '@kit.ArkData';
import { util } from '@kit.ArkTS';
import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';
import { AppVersionMode, Bugly, BuglyBuilder } from 'bugly';

const BUGLY_STORE_NAME: string = 'fzuhelper_bugly';
const BUGLY_DEVICE_ID_KEY: string = 'device_id';

export class BuglyTurboModule extends EtsUITurboModule {
  static readonly NAME: string = 'Bugly';
  private static initialized: boolean = false;
  private static userId: string = '';

  async initBugly(): Promise<void> {
    if (BuglyTurboModule.initialized) {
      return;
    }

    const resourceManager = this.ctx.uiAbilityContext.resourceManager;
    const appId = resourceManager.getStringByNameSync('bugly_app_id').trim();
    const appKey = resourceManager.getStringByNameSync('bugly_app_key').trim();
    if (appId.length === 0 || appKey.length === 0) {
      console.warn(
        '[Bugly] HarmonyOS SDK is linked, but bugly_app_id/bugly_app_key are not configured.',
      );
      return;
    }

    const bundleInfo = bundleManager.getBundleInfoForSelfSync(
      bundleManager.BundleFlag.GET_BUNDLE_INFO_DEFAULT,
    );
    const store = await preferences.getPreferences(
      this.ctx.uiAbilityContext,
      BUGLY_STORE_NAME,
    );
    let deviceId = await store.get(BUGLY_DEVICE_ID_KEY, '') as string;
    if (deviceId.length === 0) {
      deviceId = util.generateRandomUUID();
      await store.put(BUGLY_DEVICE_ID_KEY, deviceId);
      await store.flush();
    }

    const builder = new BuglyBuilder();
    builder.appId = appId;
    builder.appKey = appKey;
    builder.deviceId = deviceId;
    builder.platform = BuglyBuilder.PLATFORM_PRO;
    builder.appVersion = bundleInfo.versionName;
    builder.buildNum = `${bundleInfo.versionCode}`;
    builder.appChannel = 'HarmonyOS';
    builder.userId = BuglyTurboModule.userId;
    builder.appVersionMode = AppVersionMode.RELEASE;
    builder.debugMode = false;

    await Bugly.init(this.ctx.uiAbilityContext, builder);
    BuglyTurboModule.initialized = true;
  }

  async setUserId(userId: string): Promise<void> {
    BuglyTurboModule.userId = userId;
    if (BuglyTurboModule.initialized) {
      await Bugly.updateUserId(userId);
    }
  }
}
