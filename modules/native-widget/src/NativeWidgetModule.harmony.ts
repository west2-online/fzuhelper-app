import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

interface NativeWidgetSpec extends TurboModule {
  requestPinAppWidget(requestCode: number): Promise<number>;
  setWidgetData(json: string, packageName: string): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<NativeWidgetSpec>('NativeWidget');
