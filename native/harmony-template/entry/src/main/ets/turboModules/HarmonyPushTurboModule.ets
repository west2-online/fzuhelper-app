import { notificationManager } from '@kit.NotificationKit';
import { pushService } from '@kit.PushKit';
import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';

interface PushTagResponse {
  data: string[];
  remain: number;
  error: string;
}

export class HarmonyPushTurboModule extends EtsUITurboModule {
  static readonly NAME: string = 'ExpoUmeng';
  private static readonly TAGS_UNAVAILABLE_ERROR: string =
    'HarmonyOS Push Kit tags are unavailable until the application server registers the Push Kit token and manages audience tags.';
  private deviceToken: string = '';
  private error: string = '';
  private initializationPromise: Promise<void> | undefined = undefined;
  private registered: boolean = false;

  initUmeng(): void {
    this.ensureInitialized();
  }

  hasPermission(): boolean {
    try {
      return notificationManager.isNotificationEnabledSync();
    } catch (error) {
      this.appendError(error);
      return false;
    }
  }

  requirePermission(): void {
    notificationManager.requestEnableNotification(this.ctx.uiAbilityContext)
      .catch((error: Error) => {
        this.appendError(error);
      });
  }

  async getDeviceToken(): Promise<string> {
    await this.ensureInitialized();
    return this.deviceToken;
  }

  async isRegisteredForRemoteNotifications(): Promise<boolean> {
    await this.ensureInitialized();
    return this.registered;
  }

  async getError(): Promise<string> {
    return this.error;
  }

  async getAppKeyAndChannel(): Promise<string> {
    return 'HarmonyOS Push Kit, AppGallery Connect';
  }

  async getAllTags(): Promise<PushTagResponse> {
    return {
      data: [],
      remain: 0,
      error: HarmonyPushTurboModule.TAGS_UNAVAILABLE_ERROR,
    };
  }

  async addTags(tags: string[]): Promise<void> {
    throw new Error(HarmonyPushTurboModule.TAGS_UNAVAILABLE_ERROR);
  }

  async deleteTags(tags: string[]): Promise<void> {
    throw new Error(HarmonyPushTurboModule.TAGS_UNAVAILABLE_ERROR);
  }

  private ensureInitialized(): Promise<void> {
    if (this.initializationPromise === undefined) {
      this.initializationPromise = this.obtainToken();
    }
    return this.initializationPromise;
  }

  private async obtainToken(): Promise<void> {
    try {
      this.deviceToken = await pushService.getToken();
      this.registered = this.deviceToken.length > 0;
    } catch (error) {
      this.registered = false;
      this.appendError(error);
      // Allow a later explicit status/token query to retry a transient Push
      // Kit initialization failure.
      this.initializationPromise = undefined;
    }
  }

  private appendError(error: Object): void {
    const message = error instanceof Error ? error.message : `${error}`;
    this.error = this.error.length > 0 ? `${this.error}\n\n${message}` : message;
  }
}
