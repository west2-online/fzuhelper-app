import type { VersionAndroidResponse_Data } from '@/api/backend';
import { getApiV2VersionAndroid } from '@/api/generate';
import { ANDROID_RELEASE_CHANNEL_KEY } from '@/lib/constants';
import * as FileCache from '@/utils/file-cache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { useDownloadStore } from './download-manager';

interface UpdateCallbacks {
  onUpdate?: (data: VersionAndroidResponse_Data) => void;
  onNoUpdate?: () => void;
  onError?: (error: string) => void;
}

const downloadAndInstallApk = async (url: string, force: boolean) => {
  const downloadStore = useDownloadStore.getState();

  // 显示下载进度对话框
  downloadStore.setDownloading(true);
  downloadStore.setMessage('正在下载更新');
  downloadStore.updateProgress(0);

  try {
    // 使用 file-cache 下载并缓存 APK，并接收进度回调
    const cachedUri = await FileCache.getCachedFile(url, {
      filename: 'update.apk',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 缓存 7 天
      onProgress: progress => {
        try {
          downloadStore.updateProgress(progress);
        } catch (e) {}
      },
    });
    downloadStore.updateProgress(1);
    downloadStore.setMessage('下载完成，正在安装...');
    setTimeout(async () => {
      // 使用 FileCache.openFile 打开安装界面
      await FileCache.openFile(cachedUri);
      downloadStore.reset();
    }, 1000);
  } catch (err) {
    downloadStore.reset();
    Alert.alert('下载失败', '无法下载更新，请稍后重试。');
    throw err;
  }
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

export type ReleaseChannelType = 'release' | 'beta';

export const getReleaseChannel = async (): Promise<ReleaseChannelType> => {
  const storedChannel = (await AsyncStorage.getItem(ANDROID_RELEASE_CHANNEL_KEY)) as ReleaseChannelType | null;
  return storedChannel ?? 'release';
};

export const storeReleaseChannel = async (channel: ReleaseChannelType) => {
  await AsyncStorage.setItem(ANDROID_RELEASE_CHANNEL_KEY, channel);
};

const checkAndroidUpdate = async (handleError: (error: any) => any, callbacks?: UpdateCallbacks) => {
  // 判断是否为调试版，是则跳过
  if (__DEV__) {
    console.log('skip update check in debug mode');
    return;
  }

  try {
    const data = (await getApiV2VersionAndroid()).data.data;
    const releaseChannel = await getReleaseChannel();
    let config;
    if (releaseChannel === 'release') {
      config = data.release;
    } else {
      if (parseInt(data.beta.version_code, 10) > parseInt(data.release.version_code, 10)) {
        config = data.beta;
      } else {
        config = data.release;
      }
    }

    if (parseInt(config.version_code, 10) > parseInt(DeviceInfo.getBuildNumber(), 10)) {
      callbacks?.onUpdate?.(config);
    } else {
      try {
        // 删除可能存在的旧 APK 缓存（文件名为 update.apk）
        const cachedFiles = await FileCache.listCachedFiles();
        const apk = (cachedFiles || []).find((f: any) => f.name === 'update.apk' || f.name?.endsWith('/update.apk'));
        if (apk && apk.uri) {
          await FileCache.deleteCachedFile(apk.uri);
          console.log('android-update: removed stale update.apk', apk.uri);
        }
      } catch (e) {
        console.warn('android-update: failed to delete stale apk', e);
      }
      callbacks?.onNoUpdate?.();
    }
  } catch (error: any) {
    const data = handleError(error);
    const errorMsg = data?.msg || '未知错误';
    callbacks?.onError?.(errorMsg);
  }
};

export { checkAndroidUpdate, downloadAndInstallApk, showAndroidUpdateDialog };
