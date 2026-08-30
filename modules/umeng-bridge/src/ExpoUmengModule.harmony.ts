import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

interface PushTagResponse {
  data: string[];
  remain: number;
  error: string;
}

interface ExpoUmengSpec extends TurboModule {
  addTags(tags: string[]): Promise<void>;
  deleteTags(tags: string[]): Promise<void>;
  getAllTags(): Promise<PushTagResponse>;
  getAppKeyAndChannel(): Promise<string>;
  getDeviceToken(): Promise<string>;
  getError(): Promise<string>;
  hasPermission(): boolean;
  initUmeng(): void;
  isRegisteredForRemoteNotifications(): Promise<boolean>;
  requirePermission(): void;
}

export default TurboModuleRegistry.getEnforcing<ExpoUmengSpec>('ExpoUmeng');
