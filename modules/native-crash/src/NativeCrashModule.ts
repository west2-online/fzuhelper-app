import { NativeModule, requireNativeModule } from 'expo';

declare class NativeCrashModule extends NativeModule {
  crash(message: string): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NativeCrashModule>('NativeCrash');
