import {
  RNOHPackage,
  UITurboModule,
  UITurboModuleContext,
  UITurboModuleFactory,
} from '@rnoh/react-native-openharmony';
import { ExpoQuickActionsTurboModule } from './ExpoQuickActionsTurboModule';

class ExpoQuickActionsTurboModuleFactory extends UITurboModuleFactory {
  createTurboModule(name: string): UITurboModule | null {
    if (name === ExpoQuickActionsTurboModule.NAME) {
      return new ExpoQuickActionsTurboModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === ExpoQuickActionsTurboModule.NAME;
  }
}

export class ExpoQuickActionsPackage extends RNOHPackage {
  createUITurboModuleFactory(ctx: UITurboModuleContext): UITurboModuleFactory {
    return new ExpoQuickActionsTurboModuleFactory(ctx);
  }
}
