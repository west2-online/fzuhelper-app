#pragma once

#include "RNOH/Package.h"
#include "turboModules/FzuHelperTurboModules.h"

namespace rnoh {

// The names below are the JS-facing TurboModule names and must match the NAME
// constants declared by the ArkTS classes registered in FzuHelperPackage.ets
// and ExpoQuickActionsPackage.ets.
class FzuHelperTurboModuleFactoryDelegate : public TurboModuleFactoryDelegate {
 public:
  SharedTurboModule createTurboModule(Context ctx, const std::string& name)
      const override {
    if (name == "Bugly") {
      return std::make_shared<BuglyTurboModule>(ctx, name);
    } else if (name == "ExpoFileSystemHarmony") {
      return std::make_shared<ExpoFileSystemHarmonyTurboModule>(ctx, name);
    } else if (name == "ExpoFontLoader") {
      return std::make_shared<ExpoFontLoaderTurboModule>(ctx, name);
    } else if (name == "ExpoQuickActionsHarmony") {
      return std::make_shared<ExpoQuickActionsTurboModule>(ctx, name);
    } else if (name == "ExpoSplashScreenHarmony") {
      return std::make_shared<ExpoSplashScreenHarmonyTurboModule>(ctx, name);
    } else if (name == "ExpoUmeng") {
      return std::make_shared<HarmonyPushTurboModule>(ctx, name);
    } else if (name == "HarmonySystem") {
      return std::make_shared<HarmonySystemTurboModule>(ctx, name);
    } else if (name == "NativeBrightness") {
      return std::make_shared<NativeBrightnessTurboModule>(ctx, name);
    } else if (name == "NativeRequest") {
      return std::make_shared<NativeRequestTurboModule>(ctx, name);
    } else if (name == "NativeWidget") {
      return std::make_shared<NativeWidgetTurboModule>(ctx, name);
    }
    return nullptr;
  }
};

class FzuHelperPackage : public Package {
 public:
  FzuHelperPackage(Package::Context ctx) : Package(ctx) {}

  std::unique_ptr<TurboModuleFactoryDelegate> createTurboModuleFactoryDelegate()
      override {
    return std::make_unique<FzuHelperTurboModuleFactoryDelegate>();
  }
};

} // namespace rnoh
