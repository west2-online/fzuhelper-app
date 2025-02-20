import PageContainer from '@/components/page-container';
import { getFileIcon, guessFileType } from '@/lib/filetype';
import * as FileSystem from 'expo-file-system';
import { Stack, UnknownOutputParams, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Image, SafeAreaView, Share, Text, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';

interface FilePreviewPageParam extends UnknownOutputParams {
  filepath: string;
}

export default function FilePreviewPage() {
  const { filepath } = useLocalSearchParams<FilePreviewPageParam>();
  const filename = filepath.substring(filepath.lastIndexOf('/') + 1);
  const fileIcon = getFileIcon(guessFileType(filename));
  const downloadDir = FileSystem.cacheDirectory + 'paper';
  const localFileUri = downloadDir + filepath;
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const downloadUri = `http://files.w2fzu.com/${encodeURIComponent(filepath.substring(1))}?_upt=78e7a6691739858884`;

  useEffect(() => {
    const checkFile = async () => {
      const fileInfo = await FileSystem.getInfoAsync(localFileUri);
      setIsDownloaded(fileInfo.exists);
    };
    checkFile();
  }, [localFileUri]);

  const handleDownload = async () => {
    setIsDownloading(true);
    setProgress(0);

    try {
      const parentDir = localFileUri.substring(0, localFileUri.lastIndexOf('/') + 1);
      const parentDirInfo = await FileSystem.getInfoAsync(parentDir);
      if (!parentDirInfo.exists) await FileSystem.makeDirectoryAsync(parentDir, { intermediates: true });
      const downloadResumable = FileSystem.createDownloadResumable(downloadUri, localFileUri, {}, downloadProgress => {
        const percentage = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        setProgress(percentage);
      });
      await downloadResumable.downloadAsync();
      setIsDownloaded(true);
      toast.success('下载成功, 文件已下载到本地');
      handleShareFile();
    } catch (error) {
      toast.error('下载失败, 请检查网络: ' + error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareFile = async () => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(localFileUri);
    } else {
      toast.error('分享失败, 设备不支持分享功能:');
    }
  };

  const handleShareLink = async () => {
    try {
      Share.share({ message: downloadUri });
    } catch (error) {
      toast.error('分享失败, 设备不支持分享功能: ' + error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '文件详情' }} />

      <PageContainer>
        <SafeAreaView className="m-3 flex-1 items-center justify-center bg-background px-4 py-6">
          <Image source={fileIcon} className="mb-4 h-20 w-20" />
          <Text className="mb-4 text-lg font-semibold text-primary">{filename}</Text>
          <View className="w-full space-y-3">
            {isDownloaded ? (
              <TouchableOpacity
                onPress={handleShareFile}
                className="w-full items-center rounded-lg bg-green-500 py-3 shadow-md"
              >
                <Text className="text-base font-medium text-white">分享文件</Text>
              </TouchableOpacity>
            ) : isDownloading ? (
              <View className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-300 shadow-md">
                <View className="absolute left-0 top-0 h-full bg-blue-500" style={{ width: `${progress * 100}%` }} />
                <Text className="z-10 font-medium text-white">下载中 {Math.round(progress * 100)}%</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  onPress={handleDownload}
                  className="mb-3 h-12 w-full items-center rounded-lg bg-blue-500 py-3 shadow-md"
                >
                  <Text className="text-base font-medium text-white">下载到本地</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShareLink}
                  className="h-12 w-full items-center rounded-lg bg-green-500 py-3 shadow-md"
                >
                  <Text className="text-base font-medium text-white">分享下载链接</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <Text className="mt-6 text-sm text-gray-500">
            文件来自第三方，对于出现文件不准确导致挂科后果，不予负责，请谨慎下载
          </Text>
        </SafeAreaView>
      </PageContainer>
    </>
  );
}
