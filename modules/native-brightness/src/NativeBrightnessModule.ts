import { NativeModule, requireNativeModule } from 'expo';

declare class NativeBrightnessModule extends NativeModule {
  enableHighBrightness(): Promise<void>;
  disableHighBrightness(): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NativeBrightnessModule>('NativeBrightness');
