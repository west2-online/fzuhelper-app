#pragma once

#include <ReactCommon/TurboModule.h>
#include <string>
#include "RNOH/ArkTSTurboModule.h"

namespace rnoh {

class JSI_EXPORT BuglyTurboModule : public ArkTSTurboModule {
 public:
  BuglyTurboModule(const ArkTSTurboModule::Context ctx, const std::string name);
};

class JSI_EXPORT ExpoFileSystemHarmonyTurboModule : public ArkTSTurboModule {
 public:
  ExpoFileSystemHarmonyTurboModule(
      const ArkTSTurboModule::Context ctx,
      const std::string name);
};

class JSI_EXPORT ExpoFontLoaderTurboModule : public ArkTSTurboModule {
 public:
  ExpoFontLoaderTurboModule(
      const ArkTSTurboModule::Context ctx,
      const std::string name);
};

class JSI_EXPORT ExpoQuickActionsTurboModule : public ArkTSTurboModule {
 public:
  ExpoQuickActionsTurboModule(
      const ArkTSTurboModule::Context ctx,
      const std::string name);
};

class JSI_EXPORT ExpoSplashScreenHarmonyTurboModule : public ArkTSTurboModule {
 public:
  ExpoSplashScreenHarmonyTurboModule(
      const ArkTSTurboModule::Context ctx,
      const std::string name);
};

class JSI_EXPORT HarmonyPushTurboModule : public ArkTSTurboModule {
 public:
  HarmonyPushTurboModule(
      const ArkTSTurboModule::Context ctx,
      const std::string name);
};

class JSI_EXPORT HarmonySystemTurboModule : public ArkTSTurboModule {
 public:
  HarmonySystemTurboModule(
      const ArkTSTurboModule::Context ctx,
      const std::string name);
};

class JSI_EXPORT NativeBrightnessTurboModule : public ArkTSTurboModule {
 public:
  NativeBrightnessTurboModule(
      const ArkTSTurboModule::Context ctx,
      const std::string name);
};

class JSI_EXPORT NativeRequestTurboModule : public ArkTSTurboModule {
 public:
  NativeRequestTurboModule(
      const ArkTSTurboModule::Context ctx,
      const std::string name);
};

class JSI_EXPORT NativeWidgetTurboModule : public ArkTSTurboModule {
 public:
  NativeWidgetTurboModule(
      const ArkTSTurboModule::Context ctx,
      const std::string name);
};

} // namespace rnoh
