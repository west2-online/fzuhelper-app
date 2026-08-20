import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

interface NativeBrightnessSpec extends TurboModule {
  enableHighBrightness(): Promise<void>;
  disableHighBrightness(): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<NativeBrightnessSpec>('NativeBrightness');
