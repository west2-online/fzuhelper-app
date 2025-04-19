import { NativeModule, requireNativeModule } from 'expo';

declare class BuglyModule extends NativeModule {
  initBugly(): Promise<void>;
  setUserId(userId: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<BuglyModule>('Bugly');
