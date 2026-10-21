import { bundleManager } from '@kit.AbilityKit';
import { preferences } from '@kit.ArkData';
import { util } from '@kit.ArkTS';
import { ExpoModule, ExpoModuleDefinition, ExpoFunction, ExpoValueTypes, ExpoRecordShape } from '@expo-harmony/expo-modules-core';
import { AppVersionMode, Bugly, BuglyBuilder } from 'bugly';

const BUGLY_STORE_NAME: string = 'fzuhelper_bugly';
const BUGLY_DEVICE_ID_KEY: string = 'device_id';

export class BuglyModule extends ExpoModule {
  override definition(): ExpoModuleDefinition {
    return new ExpoModuleDefinition().name('Bugly')
      .asyncFunction('initBugly', async (): Promise<void> => this.context.runOnUIQueue(() => this.initBugly()))
      .asyncFunction('setUserId', ExpoFunction.typed1(ExpoValueTypes.string(),
        async (userId: string): Promise<void> => this.context.runOnUIQueue(() => this.setUserId(userId))));
  }
  private static initialized: boolean = false;
  private static userId: string = '';

  async initBugly(): Promise<void> {
    if (BuglyModule.initialized) {
      return;
    }

    const resourceManager = this.context.uiAbilityContext.resourceManager;
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
      this.context.uiAbilityContext,
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
    builder.userId = BuglyModule.userId;
    builder.appVersionMode = AppVersionMode.RELEASE;
    builder.debugMode = false;

    await Bugly.init(this.context.uiAbilityContext, builder);
    BuglyModule.initialized = true;
  }

  async setUserId(userId: string): Promise<void> {
    BuglyModule.userId = userId;
    if (BuglyModule.initialized) {
      await Bugly.updateUserId(userId);
    }
  }
}
