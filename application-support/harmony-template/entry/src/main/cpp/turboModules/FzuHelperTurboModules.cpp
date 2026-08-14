#include "turboModules/FzuHelperTurboModules.h"

namespace rnoh {

BuglyTurboModule::BuglyTurboModule(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_ASYNC_METHOD_METADATA(initBugly, 0),
      ARK_ASYNC_METHOD_METADATA(setUserId, 1),
  };
}

ExpoFileSystemHarmonyTurboModule::ExpoFileSystemHarmonyTurboModule(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_ASYNC_METHOD_METADATA(removeDirectory, 1),
      ARK_ASYNC_METHOD_METADATA(move, 2),
  };
}

ExpoFontLoaderTurboModule::ExpoFontLoaderTurboModule(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_METHOD_METADATA(getLoadedFonts, 0),
      ARK_ASYNC_METHOD_METADATA(loadAsync, 2),
  };
}

ExpoQuickActionsTurboModule::ExpoQuickActionsTurboModule(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_METHOD_METADATA(getInitialAction, 0),
      ARK_METHOD_METADATA(startObserving, 0),
      ARK_METHOD_METADATA(stopObserving, 0),
      ARK_ASYNC_METHOD_METADATA(setItems, 2),
  };
}

ExpoSplashScreenHarmonyTurboModule::ExpoSplashScreenHarmonyTurboModule(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_METHOD_METADATA(hide, 0),
  };
}

HarmonyPushTurboModule::HarmonyPushTurboModule(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_METHOD_METADATA(initUmeng, 0),
      ARK_METHOD_METADATA(hasPermission, 0),
      ARK_METHOD_METADATA(requirePermission, 0),
      ARK_ASYNC_METHOD_METADATA(getDeviceToken, 0),
      ARK_ASYNC_METHOD_METADATA(isRegisteredForRemoteNotifications, 0),
      ARK_ASYNC_METHOD_METADATA(getError, 0),
      ARK_ASYNC_METHOD_METADATA(getAppKeyAndChannel, 0),
      ARK_ASYNC_METHOD_METADATA(getAllTags, 0),
      ARK_ASYNC_METHOD_METADATA(addTags, 1),
      ARK_ASYNC_METHOD_METADATA(deleteTags, 1),
  };
}

HarmonySystemTurboModule::HarmonySystemTurboModule(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_ASYNC_METHOD_METADATA(shareFile, 3),
      ARK_METHOD_METADATA(isSharingAvailable, 0),
      ARK_ASYNC_METHOD_METADATA(getNavigationBarBackgroundColor, 0),
      ARK_ASYNC_METHOD_METADATA(setNavigationBarBackgroundColor, 1),
      ARK_METHOD_METADATA(getNavigationBarBehavior, 0),
      ARK_METHOD_METADATA(setNavigationBarBehavior, 1),
      ARK_METHOD_METADATA(getNavigationBarBorderColor, 0),
      ARK_METHOD_METADATA(setNavigationBarBorderColor, 1),
      ARK_ASYNC_METHOD_METADATA(getNavigationBarButtonStyle, 0),
      ARK_ASYNC_METHOD_METADATA(setNavigationBarButtonStyle, 1),
      ARK_METHOD_METADATA(getNavigationBarPosition, 0),
      ARK_ASYNC_METHOD_METADATA(setNavigationBarPosition, 1),
      ARK_METHOD_METADATA(getNavigationBarVisibility, 0),
      ARK_ASYNC_METHOD_METADATA(setNavigationBarVisibility, 1),
      ARK_ASYNC_METHOD_METADATA(digestString, 3),
      ARK_ASYNC_METHOD_METADATA(digestBytes, 2),
      ARK_METHOD_METADATA(getRandomBytes, 1),
  };
}

NativeBrightnessTurboModule::NativeBrightnessTurboModule(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_ASYNC_METHOD_METADATA(enableHighBrightness, 0),
      ARK_ASYNC_METHOD_METADATA(disableHighBrightness, 0),
  };
}

NativeRequestTurboModule::NativeRequestTurboModule(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_ASYNC_METHOD_METADATA(get, 2),
      ARK_ASYNC_METHOD_METADATA(post, 3),
      ARK_ASYNC_METHOD_METADATA(postJSON, 3),
  };
}

NativeWidgetTurboModule::NativeWidgetTurboModule(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_ASYNC_METHOD_METADATA(setWidgetData, 2),
      ARK_ASYNC_METHOD_METADATA(requestPinAppWidget, 1),
  };
}

} // namespace rnoh
