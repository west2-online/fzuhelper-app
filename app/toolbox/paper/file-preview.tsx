import { ThemedView } from '@/components/ThemedView';
import { getFileIcon, guessFileType } from '@/lib/filetype';
import Clipboard from '@react-native-clipboard/clipboard';
import * as FileSystem from 'expo-file-system';
import { Stack, UnknownOutputParams, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import * as mime from 'react-native-mime-types';
import { toast } from 'sonner-native';

interface FilePreviewPageParam extends UnknownOutputParams {
  filepath: string;
}

export default function FilePreviewPage() {
  const { filepath } = useLocalSearchParams<FilePreviewPageParam>();
  const filename = filepath.substring(filepath.lastIndexOf('/') + 1);
  const FileIcon = getFileIcon(guessFileType(filename));
  const [localFileUri, setLocalFileUri] = useState<string>('');
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const downloadUri = `http://files.w2fzu.com/${encodeURIComponent(filepath.substring(1))}?_upt=78e7a6691739858884`;

  useEffect(() => {
    switch (Platform.OS) {
      case 'android':
        setLocalFileUri(ReactNativeBlobUtil.fs.dirs.LegacyDownloadDir + '/fzuPaper/' + filepath);
        break;
      case 'ios':
        setLocalFileUri(FileSystem.cacheDirectory + 'paper' + filepath);
        break;
    }
  }, [filepath]);

  useEffect(() => {
    const checkFile = async () => {
      switch (Platform.OS) {
        case 'android':
          ReactNativeBlobUtil.fs.exists(localFileUri).then(exists => {
            setIsDownloaded(exists);
          });
          break;
        case 'ios':
          const fileInfo = await FileSystem.getInfoAsync(localFileUri);
          setIsDownloaded(fileInfo.exists);
          break;
      }
    };
    checkFile();
  }, [localFileUri]);

  const handleDownload = async () => {
    setIsDownloading(true);
    setProgress(0);

    try {
      switch (Platform.OS) {
        case 'android': {
          ReactNativeBlobUtil.config({
            fileCache: true,
            addAndroidDownloads: {
              useDownloadManager: true,
              // Show notification when response data transmitted
              notification: true,
              mediaScannable: true,
              path: localFileUri,
            },
          })
            .fetch('GET', downloadUri)
            .progress({ count: 10 }, (received, total) => {
              console.log('progress', received, total);
              setProgress(received / total);
            })
            .then(
              () => {
                setIsDownloaded(true);
                toast.success('下载成功');
                handleOpenFile();
              },
              reason => {
                throw reason;
              },
            );
          break;
        }
        case 'ios': {
          const parentDir = localFileUri.substring(0, localFileUri.lastIndexOf('/') + 1);
          const parentDirInfo = await FileSystem.getInfoAsync(parentDir);
          if (!parentDirInfo.exists) await FileSystem.makeDirectoryAsync(parentDir, { intermediates: true });
          const downloadResumable = FileSystem.createDownloadResumable(
            downloadUri,
            localFileUri,
            {},
            downloadProgress => {
              const percentage = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
              setProgress(percentage);
            },
          );
          await downloadResumable.downloadAsync();
          setIsDownloaded(true);
          toast.success('下载成功');
          handleOpenFile();
          break;
        }
      }
    } catch (error) {
      console.log(error);
      toast.error('下载失败，请检查网络：' + error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenFile = async () => {
    switch (Platform.OS) {
      case 'android': {
        ReactNativeBlobUtil.android.actionViewIntent(
          localFileUri,
          mime.lookup(localFileUri) || 'application/octet-stream',
        );
        break;
      }
      case 'ios': {
        await handleShareFile();
        break;
      }
    }
  };

  const handleShareFile = async () => {
    if (await Sharing.isAvailableAsync()) {
      switch (Platform.OS) {
        case 'android':
          const tempUri = FileSystem.cacheDirectory + filename;
          // Sharing 无法读到公有目录下App写入的文件，复制到缓存目录处理
          ReactNativeBlobUtil.fs.cp(localFileUri, tempUri);
          await Sharing.shareAsync(tempUri);
          // 删除临时文件
          ReactNativeBlobUtil.fs.unlink(tempUri);
          break;
        case 'ios':
          await Sharing.shareAsync(localFileUri);
          break;
      }
    } else {
      toast.error('分享失败，设备不支持分享功能');
    }
  };

  const handleCopyLink = async () => {
    try {
      Clipboard.setString(downloadUri);
      toast.success('已复制下载链接');
    } catch (error) {
      toast.error('复制失败：' + error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '文件详情' }} />
      <ThemedView className="flex-1 items-center justify-between bg-gray-100 px-10 py-6">
        <View className="mt-24 items-center">
          <FileIcon width={80} height={80} />
          <Text className="my-8 text-center text-lg font-semibold text-gray-800">{filename}</Text>
        </View>
        <View className="w-full space-y-3">
          {/* 已下载，仅安卓展示打开按钮 */}
          {isDownloaded && Platform.OS === 'android' && (
            <TouchableOpacity
              onPress={handleOpenFile}
              className="mb-3 w-full items-center rounded-lg bg-primary py-3 shadow-md"
            >
              <Text className="text-base font-medium text-white">打开文件</Text>
            </TouchableOpacity>
          )}

          {/* 已下载，展示分享文件按钮 */}
          {isDownloaded && (
            <TouchableOpacity
              onPress={handleShareFile}
              className="w-full items-center rounded-lg bg-green-500 py-3 shadow-md"
            >
              <Text className="text-base font-medium text-white">分享文件</Text>
            </TouchableOpacity>
          )}

          {/* 下载中进度 */}
          {isDownloading && (
            <View className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-300 shadow-md">
              <View className="absolute left-0 top-0 h-full bg-primary" style={{ width: `${progress * 100}%` }} />
              <Text className="z-10 font-medium text-white">下载中 {Math.round(progress * 100)}%</Text>
            </View>
          )}

          {/* 初始状态 */}
          {!isDownloaded && !isDownloading && (
            <>
              <TouchableOpacity
                onPress={handleDownload}
                className="mb-3 h-12 w-full items-center rounded-lg bg-primary py-3 shadow-md"
              >
                <Text className="text-base font-medium text-white">下载到本地</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCopyLink}
                className="h-12 w-full items-center rounded-lg bg-green-500 py-3 shadow-md"
              >
                <Text className="text-base font-medium text-white">复制链接</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text className="mx-2 mb-6 text-center text-sm text-gray-500">
          文件来自第三方，对于出现文件不准确导致挂科后果，不予负责，请谨慎下载
        </Text>
      </ThemedView>
    </>
  );
}
