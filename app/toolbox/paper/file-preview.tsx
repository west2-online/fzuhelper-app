import { ThemedView } from '@/components/ThemedView';
import { getFileIcon, guessFileType } from '@/lib/filetype';
import * as FileSystem from 'expo-file-system';
import { Stack, UnknownOutputParams, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Image, Share, Text, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';

interface FilePreviewPageParam extends UnknownOutputParams {
  filepath: string;
}

export default function FilePreviewPage() {
  const { filepath } = useLocalSearchParams<FilePreviewPageParam>();
  const filename = filepath.substring(filepath.lastIndexOf('/') + 1);
  const fileIcon = getFileIcon(guessFileType(filename));
  // FIXME: 实现文件管理器
  // expo 访问不了公共的 download 目录，而且 iOS 上不存在这个目录
  // 为了避免清理的麻烦，选择存储到缓存目录
  const downloadDir = FileSystem.cacheDirectory + 'paper';
  const localFileUri = downloadDir + filename;
  const [isDownloaded, setIsDownloaded] = useState(false);
  const downloadUri = `http://files.w2fzu.com/${encodeURIComponent(filepath.substring(1))}?_upt=78e7a6691739858884`;

  useEffect(() => {
    const checkFile = async () => {
      const fileInfo = await FileSystem.getInfoAsync(localFileUri);
      setIsDownloaded(fileInfo.exists);
    };
    checkFile();
  }, [localFileUri]);

  const handleDownload = async () => {
    try {
      await FileSystem.downloadAsync(downloadUri, localFileUri);
      setIsDownloaded(true);
      toast.success('下载成功, 文件已下载到本地');
      handleShareFile(); // 下载完成后自动分享，符合标准逻辑
    } catch {
      toast.error('下载失败, 请检查网络');
    }
  };

  const handleShareFile = async () => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(localFileUri);
    } else {
      toast.error('分享失败, 设备不支持分享功能');
    }
  };

  const handleShareLink = async () => {
    try {
      Share.share({ message: downloadUri });
    } catch {
      toast.error('分享失败, 设备不支持分享功能');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '文件详情' }} />
      <ThemedView className="flex-1 items-center justify-center bg-gray-100 px-4 py-6">
        <Image source={fileIcon} className="mb-4 h-20 w-20" />
        <Text className="mb-4 text-lg font-semibold text-gray-800">{filename}</Text>
        <View className="w-full space-y-3">
          {isDownloaded ? (
            // 由于 android 上使用 Intent 使用其他应用打开本应用的文件需要配置权限
            // 并且 iOS 上只有分享功能，因此选择只显示分享按钮
            <TouchableOpacity
              onPress={handleShareFile}
              className="w-full items-center rounded-lg bg-green-500 py-3 shadow-md"
            >
              <Text className="text-base font-medium text-white">分享文件</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleDownload}
                className="mb-3 w-full items-center rounded-lg bg-blue-500 py-3 shadow-md"
              >
                <Text className="text-base font-medium text-white">下载到本地</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShareLink}
                className="w-full items-center rounded-lg bg-green-500 py-3 shadow-md"
              >
                <Text className="text-base font-medium text-white">分享下载链接</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text className="mt-6 text-sm text-gray-500">
          文件来自第三方，对于出现文件不准确导致挂科后果，不予负责，请谨慎下载
        </Text>
      </ThemedView>
    </>
  );
}
