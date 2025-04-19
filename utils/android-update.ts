import type { VersionAndroidResponse_Data } from '@/types/backend';
import { getApiV2VersionAndroid } from '@/api/generate';
import { RELEASE_CHANNEL_KEY } from '@/types/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import DeviceInfo from 'react-native-device-info';
import { useDownloadStore } from './download-manager';

interface UpdateCallbacks {
  onUpdate?: (data: VersionAndroidResponse_Data) => void;
  onNoUpdate?: () => void;
  onError?: (error: string) => void;
}

const downloadAndInstallApk = (url: string, force: boolean) => {
  const downloadStore = useDownloadStore.getState();

  // 显示下载进度对话框
  downloadStore.setDownloading(true);
  downloadStore.setMessage('正在下载更新');
  downloadStore.updateProgress(0);

  ReactNativeBlobUtil.config({
    fileCache: true,
    path: ReactNativeBlobUtil.fs.dirs.CacheDir + '/update.apk',
  })
    .fetch('GET', url)
    .progress({ interval: 10 }, (received, total) => {
      const progress = received / total;
      downloadStore.updateProgress(progress);
    })
    .then(
      value => {
        downloadStore.updateProgress(1);
        downloadStore.setMessage('下载完成，正在安装...');
        setTimeout(() => {
          if (!force) {
            // 短暂延迟后关闭下载对话框，以便用户看到下载完成信息
            downloadStore.reset();
          }
          ReactNativeBlobUtil.android.actionViewIntent(value.path(), 'application/vnd.android.package-archive');
        }, 1000);
      },
      reason => {
        downloadStore.reset();
        Alert.alert('下载失败', '无法下载更新，请稍后重试。');
        throw reason;
      },
    );
};

const showAndroidUpdateDialog = (data: VersionAndroidResponse_Data) => {
  const buttons = data.force
    ? [
        {
          text: '更新',
          onPress: () => downloadAndInstallApk(data.url, data.force),
        },
      ]
    : [
        { text: '取消' },
        {
          text: '更新',
          onPress: () => downloadAndInstallApk(data.url, data.force),
        },
      ];
  Alert.alert(`发现新版本 ${data.version_name}`, `更新内容：\n\n${data.changelog}`, buttons);
};

type ReleaseChannelType = 'release' | 'beta';

const checkAndroidUpdate = async (handleError: (error: any) => any, callbacks?: UpdateCallbacks) => {
  // 判断是否为调试版，是则跳过
  if (__DEV__) {
    console.log('skip update check in debug mode');
    return;
  }

  try {
    const releaseChannel = (await AsyncStorage.getItem(RELEASE_CHANNEL_KEY)) as ReleaseChannelType | null;
    const result = await getApiV2VersionAndroid();
    const config = result.data.data[releaseChannel || 'release']; // 测试期间仅在beta通道更新

    if (parseInt(config.version_code, 10) > parseInt(DeviceInfo.getBuildNumber(), 10)) {
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
