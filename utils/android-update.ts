import type { VersionAndroidResponse_Data } from '@/api/backend';
import { getApiV2VersionAndroid } from '@/api/generate';
import { Alert } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import DeviceInfo from 'react-native-device-info';

interface UpdateCallbacks {
  onUpdate?: (data: VersionAndroidResponse_Data) => void;
  onNoUpdate?: () => void;
  onError?: (error: string) => void;
}

const downloadAndInstallApk = (url: string) => {
  // 阻断用户操作，后续优化
  Alert.alert('正在下载更新', '请稍候', []);
  console.log('download');
  ReactNativeBlobUtil.config({
    fileCache: true,
    path: ReactNativeBlobUtil.fs.dirs.CacheDir + '/update.apk',
  })
    .fetch('GET', url)
    .then(
      value => {
        console.log(value.path());
        ReactNativeBlobUtil.android.actionViewIntent(value.path(), 'application/vnd.android.package-archive');
      },
      reason => {
        throw reason;
      },
    );
};

const showAndroidUpdateDialog = (data: VersionAndroidResponse_Data) => {
  const buttons = data.force
    ? [
        {
          text: '更新',
          onPress: () => downloadAndInstallApk(data.url),
        },
      ]
    : [
        { text: '取消' },
        {
          text: '更新',
          onPress: () => downloadAndInstallApk(data.url),
        },
      ];
  Alert.alert(`发现新版本 ${data.version_name}`, `更新内容：\n\n${data.changelog}`, buttons);
};

const checkAndroidUpdate = async (handleError: (error: any) => any, callbacks?: UpdateCallbacks) => {
  try {
    const result = await getApiV2VersionAndroid();
    const config = result.data.data.beta; // 测试期间仅在beta通道更新

    if (parseInt(config.version_code, 10) !== parseInt(DeviceInfo.getBuildNumber(), 10)) {
      callbacks?.onUpdate?.(config);
    } else {
      callbacks?.onNoUpdate?.();
    }
  } catch (error: any) {
    const data = handleError(error);
    const errorMsg = data?.msg || '未知错误';
    callbacks?.onError?.(errorMsg);
  }
};

export { checkAndroidUpdate, downloadAndInstallApk, showAndroidUpdateDialog };
