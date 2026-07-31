import {
  RNOHPackage,
  UITurboModule,
  UITurboModuleContext,
  UITurboModuleFactory,
} from '@rnoh/react-native-openharmony';
import { BuglyTurboModule } from './turboModules/BuglyTurboModule';
import { ExpoFileSystemHarmonyTurboModule } from './turboModules/ExpoFileSystemHarmonyTurboModule';
import { ExpoFontLoaderTurboModule } from './turboModules/ExpoFontLoaderTurboModule';
import { ExpoSplashScreenHarmonyTurboModule } from './turboModules/ExpoSplashScreenHarmonyTurboModule';
import { HarmonyPushTurboModule } from './turboModules/HarmonyPushTurboModule';
import { HarmonySystemTurboModule } from './turboModules/HarmonySystemTurboModule';
import { NativeBrightnessTurboModule } from './turboModules/NativeBrightnessTurboModule';
import { NativeRequestTurboModule } from './turboModules/NativeRequestTurboModule';
import { NativeWidgetTurboModule } from './turboModules/NativeWidgetTurboModule';

class FzuHelperTurboModuleFactory extends UITurboModuleFactory {
  createTurboModule(name: string): UITurboModule | null {
    if (name === BuglyTurboModule.NAME) {
      return new BuglyTurboModule(this.ctx);
    }
    if (name === ExpoFileSystemHarmonyTurboModule.NAME) {
      return new ExpoFileSystemHarmonyTurboModule(this.ctx);
    }
    if (name === ExpoFontLoaderTurboModule.NAME) {
      return new ExpoFontLoaderTurboModule(this.ctx);
    }
    if (name === ExpoSplashScreenHarmonyTurboModule.NAME) {
      return new ExpoSplashScreenHarmonyTurboModule(this.ctx);
    }
    if (name === NativeRequestTurboModule.NAME) {
      return new NativeRequestTurboModule(this.ctx);
    }
    if (name === NativeBrightnessTurboModule.NAME) {
      return new NativeBrightnessTurboModule(this.ctx);
    }
    if (name === HarmonySystemTurboModule.NAME) {
      return new HarmonySystemTurboModule(this.ctx);
    }
    if (name === HarmonyPushTurboModule.NAME) {
      return new HarmonyPushTurboModule(this.ctx);
    }
    if (name === NativeWidgetTurboModule.NAME) {
      return new NativeWidgetTurboModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === BuglyTurboModule.NAME
      || name === ExpoFileSystemHarmonyTurboModule.NAME
      || name === ExpoFontLoaderTurboModule.NAME
      || name === ExpoSplashScreenHarmonyTurboModule.NAME
      || name === NativeRequestTurboModule.NAME
      || name === NativeBrightnessTurboModule.NAME
      || name === HarmonySystemTurboModule.NAME
      || name === HarmonyPushTurboModule.NAME
      || name === NativeWidgetTurboModule.NAME;
  }
}

export class FzuHelperPackage extends RNOHPackage {
  createUITurboModuleFactory(ctx: UITurboModuleContext): UITurboModuleFactory {
    return new FzuHelperTurboModuleFactory(ctx);
  }
}
