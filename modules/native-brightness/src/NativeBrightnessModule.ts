import { NativeModule, requireNativeModule } from 'expo';

declare class NativeBrightnessModule extends NativeModule {
  enableHighBrightness(): void;
  disableHighBrightness(): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NativeBrightnessModule>('NativeBrightness');
