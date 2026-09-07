import { notificationManager } from '@kit.NotificationKit';
import { init } from '@umeng/analytics';
import { PushAgent } from '@umeng/push';
import { ExpoModule, ExpoModuleDefinition, ExpoFunction, ExpoValueTypes, ExpoRecordShape } from '@expo-harmony/expo-modules-core';

interface PushTagResponse {
  data: string[];
  remain: number;
  error: string;
}

type UmengResultValue = string | number | boolean | string[];
type UmengResult = Record<string, UmengResultValue>;

export class ExpoUmengModule extends ExpoModule {
  override definition(): ExpoModuleDefinition {
    return new ExpoModuleDefinition().name('ExpoUmeng')
      .onCreate((): void => {
        PushAgent.initCallback((data: Record<string, string>): void => ExpoUmengModule.onInitCallback(data));
      })
      .syncFunction('initUmeng', (): void => this.initUmeng())
      .syncFunction('hasPermission', (): boolean => this.hasPermission())
      .syncFunction('requirePermission', (): void => this.requirePermission())
      .asyncFunction('getDeviceToken', async (): Promise<string> => this.getDeviceToken())
      .asyncFunction('isRegisteredForRemoteNotifications', async (): Promise<boolean> => this.isRegisteredForRemoteNotifications())
      .asyncFunction('getError', async (): Promise<string> => this.getError())
      .asyncFunction('getAppKeyAndChannel', async (): Promise<string> => this.getAppKeyAndChannel())
      .asyncFunction('getAllTags', async (): Promise<PushTagResponse> => this.getAllTags())
      .asyncFunction('addTags', ExpoFunction.typed1(ExpoValueTypes.array(ExpoValueTypes.string()),
        async (tags: string[]): Promise<void> => this.addTags(tags)))
      .asyncFunction('deleteTags', ExpoFunction.typed1(ExpoValueTypes.array(ExpoValueTypes.string()),
        async (tags: string[]): Promise<void> => this.deleteTags(tags)));
  }
  private static readonly TAG_LIMIT: number = 1024;
  private static deviceToken: string = '';
  private static registered: boolean = false;
  private static error: string = '';

  private initializationPromise: Promise<void> | undefined = undefined;

  /**
   * PushAgent reports the Umeng device token through this callback. It is
   * registered through Expo Modules before initialization, so the token is
   * available without requesting a Huawei Push Kit token directly.
   */
  static onInitCallback(data: Record<string, string>): void {
    const token: string = data['data'] ?? data['device_token'] ?? data['deviceToken'] ?? '';
    if (token.length > 0) {
      ExpoUmengModule.deviceToken = token;
      ExpoUmengModule.registered = true;
    }

    const status: string = data['status'] ?? data['connect_status'] ?? '';
    if (status === 'connected' || status === 'success') {
      ExpoUmengModule.registered = true;
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
      PushAgent.enableNotification(this.context.uiAbilityContext, (result: Record<string, string>) => {
        const message = ExpoUmengModule.getResponseError(result);
        if (message.length > 0) {
          ExpoUmengModule.appendStaticError(message);
        }
      });
    } catch (error) {
      this.appendError(error);
    }
  }

  async getDeviceToken(): Promise<string> {
    await this.ensureInitialized();
    return ExpoUmengModule.deviceToken;
  }

  async isRegisteredForRemoteNotifications(): Promise<boolean> {
    await this.ensureInitialized();
    return ExpoUmengModule.registered;
  }

  async getError(): Promise<string> {
    return ExpoUmengModule.error;
  }

  async getAppKeyAndChannel(): Promise<string> {
    const resourceManager = this.context.uiAbilityContext.resourceManager;
    const appKey = resourceManager.getStringByNameSync('umeng_app_key');
    const channel = resourceManager.getStringByNameSync('umeng_channel');
    return `${appKey}, ${channel}`;
  }

  async getAllTags(): Promise<PushTagResponse> {
    await this.ensureInitialized();
    return await new Promise<PushTagResponse>((resolve) => {
      try {
        PushAgent.getTags((result: UmengResult) => {
          resolve(ExpoUmengModule.mapTagResponse(result));
        });
      } catch (error) {
        const message = ExpoUmengModule.formatError(error);
        ExpoUmengModule.appendStaticError(message);
        resolve({
          data: [],
          remain: ExpoUmengModule.TAG_LIMIT,
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
          const message = ExpoUmengModule.getResponseError(result);
          if (message.length > 0) {
            ExpoUmengModule.appendStaticError(message);
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
          const message = ExpoUmengModule.getResponseError(result);
          if (message.length > 0) {
            ExpoUmengModule.appendStaticError(message);
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
      ExpoUmengModule.registered = false;
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
      : Math.max(0, ExpoUmengModule.TAG_LIMIT - data.length);
    return {
      data,
      remain,
      error: ExpoUmengModule.getResponseError(result),
    };
  }

  private static getResponseError(result: UmengResult): string {
    if (result['success'] === false || result['success'] === 'false') {
      return `${result['msg'] ?? result['error'] ?? 'Umeng push operation failed'}`;
    }

    const code = result['code'];
    if (code === undefined || code === null || ExpoUmengModule.isSuccessCode(code)) {
      return '';
    }
    return `${result['msg'] ?? result['error'] ?? `Umeng push operation failed (${code})`}`;
  }

  private static isSuccessCode(code: UmengResultValue): boolean {
    return code === 0 || code === '0' || code === 200 || code === '200' ||
      code === 'success' || code === 'SUCCESS';
  }

  private static appendStaticError(message: string): void {
    ExpoUmengModule.error = ExpoUmengModule.error.length > 0
      ? `${ExpoUmengModule.error}\n\n${message}`
      : message;
  }

  private static formatError(error: Object): string {
    return error instanceof Error ? error.message : `${error}`;
  }

  private appendError(error: Object): void {
    ExpoUmengModule.appendStaticError(ExpoUmengModule.formatError(error));
  }
}
