import AbilityStage from '@ohos.app.ability.AbilityStage';
import { InternalPlugin, preInit } from '@umeng/analytics';
import { PushPlugin } from '@umeng/push';

export default class EntryAbilityStage extends AbilityStage {
  override onCreate(): void {
    const resourceManager = this.context.resourceManager;
    preInit({
      context: this.context.getApplicationContext(),
      appKey: resourceManager.getStringByNameSync('umeng_app_key'),
      channel: resourceManager.getStringByNameSync('umeng_channel'),
      enableLog: false,
      plugins: [
        new InternalPlugin(),
        new PushPlugin({ appMessageSecret: resourceManager.getStringByNameSync('umeng_message_secret') }),
      ],
    });
  }
}
