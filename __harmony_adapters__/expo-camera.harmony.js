'use strict';

const React = require('react');
const { Camera: HarmonyCamera, CameraType: HarmonyCameraType } = require('@react-native-ohos/react-native-camera-kit');
const { PERMISSIONS, RESULTS, check, request } = require('@react-native-ohos/react-native-permissions');
const { createPermissionHook } = require('expo');
const { UnavailabilityError } = require('expo-modules-core');

const EVENT_THROTTLE_MS = 500;
const HARMONY_NORMALIZED_ZOOM_MAX = 10;
const HARMONY_FLASH_MODE = {
  off: 0,
  on: 1,
  auto: 2,
  screen: 1,
};
const HARMONY_FOCUS_MODE_AUTO = 2;
const BARCODE_TYPES = {
  'code-128': 'code128',
  'code-39': 'code39',
  'code-93': 'code93',
  codabar: 'codabar',
  'ean-13': 'ean13',
  'ean-8': 'ean8',
  itf: 'itf14',
  'upc-e': 'upc_e',
  qr: 'qr',
  'pdf-417': 'pdf417',
  aztec: 'aztec',
  'data-matrix': 'datamatrix',
  unknown: 'unknown',
};
const SUPPORTED_EXPO_BARCODE_TYPES = new Set(Object.values(BARCODE_TYPES).filter(type => type !== 'unknown'));
const CAMERA_ORIENTATIONS = {
  0: 'portrait',
  1: 'landscapeLeft',
  2: 'portraitUpsideDown',
  3: 'landscapeRight',
};
const warnedFeatures = new Set();
const requestedPermissions = new Set();

let loggedRenderingChildrenWarning = false;

function warnOnce(feature, message) {
  if (warnedFeatures.has(feature)) return;
  warnedFeatures.add(feature);
  console.warn(message);
}

function unavailable(method) {
  return new UnavailabilityError('expo-camera', method);
}

function toPermissionResponse(result, isRequest) {
  switch (result) {
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      return {
        canAskAgain: true,
        expires: 'never',
        granted: true,
        status: 'granted',
      };
    case RESULTS.DENIED:
      return {
        canAskAgain: true,
        expires: 'never',
        granted: false,
        status: isRequest ? 'denied' : 'undetermined',
      };
    case RESULTS.BLOCKED:
    case RESULTS.UNAVAILABLE:
      return {
        canAskAgain: false,
        expires: 'never',
        granted: false,
        status: 'denied',
      };
    default: {
      const error = new Error(`HarmonyOS returned an invalid permission status: ${result}`);
      error.code = 'ERR_INVALID_PERMISSION_STATUS';
      throw error;
    }
  }
}

async function getPermissionAsync(permission) {
  return toPermissionResponse(await check(permission), requestedPermissions.has(permission));
}

async function requestPermissionAsync(permission) {
  const result = await request(permission);
  requestedPermissions.add(permission);
  return toPermissionResponse(result, true);
}

async function getCameraPermissionsAsync() {
  return getPermissionAsync(PERMISSIONS.HARMONY.CAMERA);
}

async function requestCameraPermissionsAsync() {
  return requestPermissionAsync(PERMISSIONS.HARMONY.CAMERA);
}

async function getMicrophonePermissionsAsync() {
  return getPermissionAsync(PERMISSIONS.HARMONY.MICROPHONE);
}

async function requestMicrophonePermissionsAsync() {
  return requestPermissionAsync(PERMISSIONS.HARMONY.MICROPHONE);
}

const useCameraPermissions = createPermissionHook({
  getMethod: getCameraPermissionsAsync,
  requestMethod: requestCameraPermissionsAsync,
});

const useMicrophonePermissions = createPermissionHook({
  getMethod: getMicrophonePermissionsAsync,
  requestMethod: requestMicrophonePermissionsAsync,
});

async function scanFromURLAsync() {
  throw unavailable('scanFromURLAsync');
}

function normalizeBarcodeEvent(event) {
  const nativeEvent = event?.nativeEvent ?? event ?? {};
  const nativeType = nativeEvent.codeFormat ?? 'unknown';
  const type = BARCODE_TYPES[nativeType] ?? nativeType;
  const data = nativeEvent.codeStringValue ?? '';

  return {
    bounds: {
      origin: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
    },
    cornerPoints: [],
    data,
    raw: data,
    type,
  };
}

function normalizeOrientation(event) {
  const nativeEvent = event?.nativeEvent ?? event ?? {};
  const orientation = nativeEvent.orientation;
  return {
    orientation: CAMERA_ORIENTATIONS[orientation] ?? (typeof orientation === 'string' ? orientation : 'portrait'),
  };
}

function normalizePicture(result) {
  const uri = result?.uri ?? result?.path;
  if (!uri) {
    const error = new Error('HarmonyOS camera capture did not return an image URI');
    error.code = 'ERR_CAMERA_CAPTURE_FAILED';
    throw error;
  }

  return {
    width: result.width,
    height: result.height,
    format: 'jpg',
    uri,
  };
}

function validatePictureOptions(options) {
  if (!options || typeof options !== 'object') {
    return {};
  }

  if (options.mirror) {
    console.warn('The `mirror` option is deprecated. Please use the `mirror` prop on the `CameraView` instead.');
  }

  if (options.quality === undefined) {
    options.quality = 1;
  }

  if (options.pictureRef) throw unavailable('takePictureAsync({ pictureRef: true })');
  if (options.base64) throw unavailable('takePictureAsync({ base64: true })');
  if (options.exif || options.additionalExif) {
    throw unavailable('takePictureAsync({ exif: true })');
  }
  if (options.skipProcessing) {
    throw unavailable('takePictureAsync({ skipProcessing: true })');
  }
  if (options.mirror) throw unavailable('takePictureAsync({ mirror: true })');
  if (options.shutterSound === false) {
    throw unavailable('takePictureAsync({ shutterSound: false })');
  }
  if (options.quality != null && options.quality !== 1) {
    throw unavailable('takePictureAsync({ quality })');
  }

  return options;
}

class CameraView extends React.Component {
  constructor(props) {
    super(props);
    this.state = { previewPaused: false };
    this.cameraRef = React.createRef();
    this.lastEvents = {};
    this.lastEventTimes = {};
  }

  static async isAvailableAsync() {
    throw unavailable('isAvailableAsync');
  }

  static async getAvailableVideoCodecsAsync() {
    throw unavailable('getAvailableVideoCodecsAsync');
  }

  static async launchScanner() {
    throw unavailable('launchScanner');
  }

  static async dismissScanner() {
    throw unavailable('dismissScanner');
  }

  static onModernBarcodeScanned() {
    throw unavailable('onModernBarcodeScanned');
  }

  async getAvailablePictureSizesAsync() {
    throw unavailable('getAvailablePictureSizesAsync');
  }

  async getAvailableLensesAsync() {
    throw unavailable('getAvailableLensesAsync');
  }

  getSupportedFeatures() {
    return {
      isModernBarcodeScannerAvailable: false,
      toggleRecordingAsyncAvailable: false,
    };
  }

  resumePreview() {
    return new Promise(resolve => {
      this.setState({ previewPaused: false }, resolve);
    });
  }

  pausePreview() {
    return new Promise(resolve => {
      this.setState({ previewPaused: true }, resolve);
    });
  }

  async takePictureAsync(options) {
    const pictureOptions = validatePictureOptions(options);

    if (this.state.previewPaused || this.props.active === false) {
      const error = new Error('Camera preview is not active');
      error.code = 'ERR_CAMERA_INACTIVE';
      throw error;
    }
    if (!this.cameraRef.current) {
      const error = new Error('Camera is not ready');
      error.code = 'ERR_CAMERA_NOT_READY';
      throw error;
    }

    const picture = normalizePicture(await this.cameraRef.current.capture());
    if (pictureOptions.onPictureSaved) {
      pictureOptions.onPictureSaved(picture);
      return undefined;
    }
    return picture;
  }

  async recordAsync() {
    throw unavailable('recordAsync');
  }

  async toggleRecordingAsync() {
    throw unavailable('toggleRecordingAsync');
  }

  stopRecording() {
    throw unavailable('stopRecording');
  }

  onBarcodeRead = event => {
    const result = normalizeBarcodeEvent(event);
    const allowedTypes = this.props.barcodeScannerSettings?.barcodeTypes;
    if (allowedTypes && !allowedTypes.includes(result.type)) {
      return;
    }

    const serialized = JSON.stringify(result);
    const lastEventTime = this.lastEventTimes[result.type];
    if (
      this.lastEvents[result.type] === serialized &&
      lastEventTime &&
      Date.now() - lastEventTime < EVENT_THROTTLE_MS
    ) {
      return;
    }

    if (this.props.onBarcodeScanned) {
      this.props.onBarcodeScanned(result);
      this.lastEvents[result.type] = serialized;
      this.lastEventTimes[result.type] = Date.now();
    }
  };

  onCameraError = event => {
    const nativeEvent = event?.nativeEvent ?? event ?? {};
    this.props.onMountError?.({
      message: nativeEvent.errorMessage ?? nativeEvent.message ?? 'Camera failed to start',
    });
  };

  onOrientationChange = event => {
    this.props.onResponsiveOrientationChanged?.(normalizeOrientation(event));
  };

  render() {
    const {
      active = true,
      animateShutter,
      autofocus = 'off',
      barcodeScannerSettings,
      children,
      enableTorch = false,
      facing = 'back',
      flash = 'off',
      mirror = false,
      mode = 'picture',
      mute: _mute,
      onAvailableLensesChanged,
      onBarcodeScanned,
      onCameraReady,
      onMountError: _onMountError,
      onResponsiveOrientationChanged,
      pictureSize,
      poster: _poster,
      ratio,
      responsiveOrientationWhenOrientationLocked,
      selectedLens,
      style,
      videoBitrate,
      videoQuality,
      videoStabilizationMode,
      zoom = 0,
      ...viewProps
    } = this.props;

    if (children && !loggedRenderingChildrenWarning) {
      console.warn(
        'The <CameraView> component does not support children. This may lead to inconsistent behaviour or crashes. If you want to render content on top of the Camera, consider using absolute positioning.',
      );
      loggedRenderingChildrenWarning = true;
    }

    if (flash === 'screen') {
      warnOnce(
        'screen-flash',
        'expo-camera: HarmonyOS does not expose a screen-flash mode; hardware flash is used as the closest available mode.',
      );
    }
    if (zoom !== 0) {
      warnOnce(
        'normalized-zoom',
        'expo-camera: HarmonyOS does not expose the camera zoom range. Expo zoom is mapped to the camera-kit 1x–10x range and then clamped by the device.',
      );
    }
    if (mirror) {
      warnOnce(
        'mirror',
        'expo-camera: the `mirror` prop is unavailable on HarmonyOS and is not applied to captured images.',
      );
    }
    if (mode !== 'picture') {
      warnOnce(
        'video-mode',
        'expo-camera: video mode is unavailable on HarmonyOS; only picture preview and capture are supported.',
      );
    }
    if (
      animateShutter != null ||
      pictureSize != null ||
      selectedLens != null ||
      ratio != null ||
      videoBitrate != null ||
      videoQuality != null ||
      videoStabilizationMode != null ||
      responsiveOrientationWhenOrientationLocked != null
    ) {
      warnOnce(
        'unsupported-camera-props',
        'expo-camera: one or more device-specific camera props are unavailable on HarmonyOS and were not applied.',
      );
    }
    if (onCameraReady) {
      warnOnce(
        'camera-ready',
        'expo-camera: the HarmonyOS camera-kit does not expose a camera-ready event; `onCameraReady` cannot be emitted reliably.',
      );
    }
    if (onAvailableLensesChanged) {
      warnOnce('available-lenses', 'expo-camera: available-lens change events are unavailable on HarmonyOS.');
    }
    if (barcodeScannerSettings?.barcodeTypes?.some(type => !SUPPORTED_EXPO_BARCODE_TYPES.has(type))) {
      warnOnce(
        'unsupported-barcode-type',
        'expo-camera: one or more requested barcode types are unavailable in the HarmonyOS camera-kit.',
      );
    }
    if (!active || this.state.previewPaused) {
      return null;
    }

    const normalizedZoom = Math.max(0, Math.min(1, zoom));
    return React.createElement(HarmonyCamera, {
      ...viewProps,
      ref: this.cameraRef,
      cameraType: facing === 'front' ? HarmonyCameraType.Front : HarmonyCameraType.Back,
      flashMode: HARMONY_FLASH_MODE[flash] ?? HARMONY_FLASH_MODE.off,
      focusMode: autofocus === 'on' ? HARMONY_FOCUS_MODE_AUTO : undefined,
      maxZoom: HARMONY_NORMALIZED_ZOOM_MAX,
      onError: this.onCameraError,
      onOrientationChange: onResponsiveOrientationChanged ? this.onOrientationChange : undefined,
      onReadCode: onBarcodeScanned ? this.onBarcodeRead : undefined,
      scanBarcode: Boolean(onBarcodeScanned),
      shutterPhotoSound: true,
      style,
      torchMode: enableTorch ? 'on' : 'off',
      zoom: 1 + Math.round(normalizedZoom * (HARMONY_NORMALIZED_ZOOM_MAX - 1)),
      zoomMode: 'on',
      children,
    });
  }
}

CameraView.isModernBarcodeScannerAvailable = false;
CameraView.ConversionTables = {
  type: {
    front: HarmonyCameraType.Front,
    back: HarmonyCameraType.Back,
  },
  flash: HARMONY_FLASH_MODE,
};
CameraView.defaultProps = {
  zoom: 0,
  facing: 'back',
  enableTorch: false,
  mode: 'picture',
  flash: 'off',
};

const Camera = {
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  getMicrophonePermissionsAsync,
  requestMicrophonePermissionsAsync,
  scanFromURLAsync,
};

module.exports = {
  Camera,
  CameraView,
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  useCameraPermissions,
  getMicrophonePermissionsAsync,
  requestMicrophonePermissionsAsync,
  useMicrophonePermissions,
  scanFromURLAsync,
};
