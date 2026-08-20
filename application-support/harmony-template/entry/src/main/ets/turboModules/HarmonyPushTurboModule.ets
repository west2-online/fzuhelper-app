import { notificationManager } from '@kit.NotificationKit';
import { init } from '@umeng/analytics';
import { PushAgent } from '@umeng/push';
import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';
import { UMENG_APP_KEY, UMENG_CHANNEL } from '../config/UmengConfig';

interface PushTagResponse {
  data: string[];
  remain: number;
  error: string;
}

type UmengResultValue = string | number | boolean | string[];
type UmengResult = Record<string, UmengResultValue>;

export class HarmonyPushTurboModule extends EtsUITurboModule {
  static readonly NAME: string = 'ExpoUmeng';
  private static readonly TAG_LIMIT: number = 1024;
  private static deviceToken: string = '';
  private static registered: boolean = false;
  private static error: string = '';

  private initializationPromise: Promise<void> | undefined = undefined;

  /**
   * PushAgent reports the Umeng device token through this callback. It is
   * registered in EntryAbility before React Native starts, so the token is
   * available without requesting a Huawei Push Kit token directly.
   */
  static onInitCallback(data: Record<string, string>): void {
    const token: string = data['data'] ?? data['device_token'] ?? data['deviceToken'] ?? '';
    if (token.length > 0) {
      HarmonyPushTurboModule.deviceToken = token;
      HarmonyPushTurboModule.registered = true;
    }

    const status: string = data['status'] ?? data['connect_status'] ?? '';
    if (status === 'connected' || status === 'success') {
      HarmonyPushTurboModule.registered = true;
    }
  }

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
    try {
      PushAgent.enableNotification(this.ctx.uiAbilityContext, (result: Record<string, string>) => {
        const message = HarmonyPushTurboModule.getResponseError(result);
        if (message.length > 0) {
          HarmonyPushTurboModule.appendStaticError(message);
        }
      });
    } catch (error) {
      this.appendError(error);
    }
  }

  async getDeviceToken(): Promise<string> {
    await this.ensureInitialized();
    return HarmonyPushTurboModule.deviceToken;
  }

  async isRegisteredForRemoteNotifications(): Promise<boolean> {
    await this.ensureInitialized();
    return HarmonyPushTurboModule.registered;
  }

  async getError(): Promise<string> {
    return HarmonyPushTurboModule.error;
  }

  async getAppKeyAndChannel(): Promise<string> {
    return `${UMENG_APP_KEY}, ${UMENG_CHANNEL}`;
  }

  async getAllTags(): Promise<PushTagResponse> {
    await this.ensureInitialized();
    return await new Promise<PushTagResponse>((resolve) => {
      try {
        PushAgent.getTags((result: UmengResult) => {
          resolve(HarmonyPushTurboModule.mapTagResponse(result));
        });
      } catch (error) {
        const message = HarmonyPushTurboModule.formatError(error);
        HarmonyPushTurboModule.appendStaticError(message);
        resolve({
          data: [],
          remain: HarmonyPushTurboModule.TAG_LIMIT,
          error: message,
        });
      }
    });
  }

  async addTags(tags: string[]): Promise<void> {
    await this.ensureInitialized();
    await new Promise<void>((resolve) => {
      try {
        PushAgent.addTags(tags, (result: Record<string, string>) => {
          const message = HarmonyPushTurboModule.getResponseError(result);
          if (message.length > 0) {
            HarmonyPushTurboModule.appendStaticError(message);
          }
          resolve();
        });
      } catch (error) {
        this.appendError(error);
        resolve();
      }
    });
  }

  async deleteTags(tags: string[]): Promise<void> {
    await this.ensureInitialized();
    await new Promise<void>((resolve) => {
      try {
        PushAgent.deleteTags(tags, (result: Record<string, string>) => {
          const message = HarmonyPushTurboModule.getResponseError(result);
          if (message.length > 0) {
            HarmonyPushTurboModule.appendStaticError(message);
          }
          resolve();
        });
      } catch (error) {
        this.appendError(error);
        resolve();
      }
    });
  }

  private ensureInitialized(): Promise<void> {
    if (this.initializationPromise === undefined) {
      this.initializationPromise = this.initialize();
    }
    return this.initializationPromise;
  }

  private async initialize(): Promise<void> {
    try {
      await init();
    } catch (error) {
      HarmonyPushTurboModule.registered = false;
      this.appendError(error);
      // Allow a later explicit initialization or status query to retry a
      // transient Umeng initialization failure.
      this.initializationPromise = undefined;
    }
  }

  private static mapTagResponse(result: UmengResult): PushTagResponse {
    const rawData = result['data'];
    const data: string[] = Array.isArray(rawData) ? rawData as string[] : [];
    const rawRemain = result['remain'];
    const remain: number = typeof rawRemain === 'number'
      ? rawRemain
      : Math.max(0, HarmonyPushTurboModule.TAG_LIMIT - data.length);
    return {
      data,
      remain,
      error: HarmonyPushTurboModule.getResponseError(result),
    };
  }

  private static getResponseError(result: UmengResult): string {
    if (result['success'] === false || result['success'] === 'false') {
      return `${result['msg'] ?? result['error'] ?? 'Umeng push operation failed'}`;
    }

    const code = result['code'];
    if (code === undefined || code === null || HarmonyPushTurboModule.isSuccessCode(code)) {
      return '';
    }
    return `${result['msg'] ?? result['error'] ?? `Umeng push operation failed (${code})`}`;
  }

  private static isSuccessCode(code: UmengResultValue): boolean {
    return code === 0 || code === '0' || code === 200 || code === '200' ||
      code === 'success' || code === 'SUCCESS';
  }

  private static appendStaticError(message: string): void {
    HarmonyPushTurboModule.error = HarmonyPushTurboModule.error.length > 0
      ? `${HarmonyPushTurboModule.error}\n\n${message}`
      : message;
  }

  private static formatError(error: Object): string {
    return error instanceof Error ? error.message : `${error}`;
  }

  private appendError(error: Object): void {
    HarmonyPushTurboModule.appendStaticError(HarmonyPushTurboModule.formatError(error));
  }
}
