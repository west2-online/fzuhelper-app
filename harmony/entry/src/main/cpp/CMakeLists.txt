cmake_minimum_required(VERSION 3.13)
project(fzuhelper)

set(RNOH_APP_DIR "${CMAKE_CURRENT_SOURCE_DIR}")
set(NODE_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../node_modules")
set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../../oh_modules")
set(RNOH_CPP_DIR "${OH_MODULES}/@rnoh/react-native-openharmony/src/main/cpp")
set(LOG_VERBOSITY_LEVEL 1)
set(CMAKE_ASM_FLAGS "-Wno-error=unused-command-line-argument -Qunused-arguments")
set(CMAKE_CXX_FLAGS "-fstack-protector-strong -Wl,-z,relro,-z,now,-z,noexecstack -s -fPIE -pie")
set(WITH_HITRACE_SYSTRACE ON)
set(WITH_HITRACE_REACT_MARKER ON)

add_subdirectory("${RNOH_CPP_DIR}" ./rn)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-worklets/src/main/cpp" ./worklets)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-reanimated/src/main/cpp" ./reanimated)
add_subdirectory("${OH_MODULES}/@react-native-ohos/async-storage/src/main/cpp" ./async_storage)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-blob-util/src/main/cpp" ./blob_util)
add_subdirectory("${OH_MODULES}/@react-native-ohos/blur/src/main/cpp" ./blur)
add_subdirectory("${OH_MODULES}/@react-native-ohos/clipboard/src/main/cpp" ./clipboard)
add_subdirectory("${OH_MODULES}/@react-native-ohos/cookies/src/main/cpp" ./cookies)
add_subdirectory("${OH_MODULES}/@react-native-ohos/geolocation/src/main/cpp" ./geolocation)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-gesture-handler/src/main/cpp" ./gesture_handler)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-camera-kit/src/main/cpp" ./camera_kit)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-image-crop-picker/src/main/cpp" ./image_crop_picker)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-keyboard-controller/src/main/cpp" ./keyboard_controller)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-permissions/src/main/cpp" ./permissions)
add_subdirectory("${OH_MODULES}/@react-native-oh-tpl/react-native-linear-gradient/src/main/cpp" ./linear_gradient)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-device-info/src/main/cpp" ./device_info)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-safe-area-context/src/main/cpp" ./safe_area)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-screens/src/main/cpp" ./screens)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-splash-screen/src/main/cpp" ./splash_screen)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-svg/src/main/cpp" ./svg)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-webview/src/main/cpp" ./webview)

add_library(rnoh_app SHARED
  "./PackageProvider.cpp"
  "${RNOH_CPP_DIR}/RNOHAppNapiBridge.cpp"
)

target_link_libraries(rnoh_app PUBLIC
  rnoh
  rnoh_worklets
  rnoh_reanimated
  rnoh_async_storage
  rnoh_blob_util
  rnoh_blur
  rnoh_camera_kit
  rnoh_clipboard
  rnoh_cookies
  rnoh_geolocation
  rnoh_gesture_handler
  rnoh_image_crop_picker
  rnoh_keyboard_controller
  rnoh_linear_gradient
  rnoh_permissions
  rnoh_screens
  rnoh_splash_screen
  device_info
  rnoh_safe_area
  rnoh_svg
  rnoh_webview
)
