import AbilityStage from '@ohos.app.ability.AbilityStage';
import { InternalPlugin, preInit } from '@umeng/analytics';
import { PushPlugin } from '@umeng/push';
import { UMENG_MESSAGE_SECRET } from '../config/UmengConfig';

export default class EntryAbilityStage extends AbilityStage {
  override onCreate(): void {
    preInit({
      context: this.context.getApplicationContext(),
      enableLog: false,
      plugins: [
        new InternalPlugin(),
        new PushPlugin({ appMessageSecret: UMENG_MESSAGE_SECRET }),
      ],
    });
  }
}
