import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

interface BuglySpec extends TurboModule {
  initBugly(): Promise<void>;
  setUserId(userId: string): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<BuglySpec>('Bugly');
