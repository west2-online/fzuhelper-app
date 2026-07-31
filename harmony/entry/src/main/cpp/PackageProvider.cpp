#include "RNOH/PackageProvider.h"

#include "AsyncStoragePackage.h"
#include "BlobUtilPackage.h"
#include "BlurPackage.h"
#include "CameraKitPackage.h"
#include "ClipboardPackage.h"
#include "CookiesPackage.h"
#include "GeoLocationPackage.h"
#include "GestureHandlerPackage.h"
#include "ImageCropPickerPackage.h"
#include "LinearGradientPackage.h"
#include "PermissionsPackage.h"
#include "RNDeviceInfoPackage.h"
#include "ReanimatedPackage.h"
#include "ReanimatedWorkletPackage.h"
#include "ScreensPackage.h"
#include "SplashScreenPackage.h"
#include "SVGPackage.h"
#include "SafeAreaViewPackage.h"
#include "WebViewPackage.h"
#include "keyboardControllerPackage.h"

using namespace rnoh;

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
  return {
      std::make_shared<ReanimatedWorkletPackage>(ctx),
      std::make_shared<ReanimatedPackage>(ctx),
      std::make_shared<AsyncStoragePackage>(ctx),
      std::make_shared<RNBlobUtilPackage>(ctx),
      std::make_shared<BlurPackage>(ctx),
      std::make_shared<CameraKitPackage>(ctx),
      std::make_shared<ClipboardPackage>(ctx),
      std::make_shared<CookiesPackage>(ctx),
      std::make_shared<GeoLocationPackage>(ctx),
      std::make_shared<GestureHandlerPackage>(ctx),
      std::make_shared<ImageCropPickerPackage>(ctx),
      std::make_shared<KeyboardControllerPackage>(ctx),
      std::make_shared<LinearGradientPackage>(ctx),
      std::make_shared<PermissionsPackage>(ctx),
      std::make_shared<RNDeviceInfoPackage>(ctx),
      std::make_shared<SafeAreaViewPackage>(ctx),
      std::make_shared<ScreensPackage>(ctx),
      std::make_shared<SplashScreenPackage>(ctx),
      std::make_shared<SVGPackage>(ctx),
      std::make_shared<WebViewPackage>(ctx),
  };
}
