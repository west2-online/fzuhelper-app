import { Card } from '@/components/ui/card';
import { REMOTE_MAP_URL } from '@/lib/constants';
import { getCachedFile } from '@/utils/file-cache';
import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useEffect, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ImageZoom from 'react-native-image-zoom-viewer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
// 学习中心地图组件
const LearningCenterMap = memo(() => {
  const [showFullScreenMap, setShowFullScreenMap] = useState(false); //控制是否展示全屏地图
  const [localMapUri, setLocalMapUri] = useState<string>('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const uri = await getCachedFile(REMOTE_MAP_URL, {
          filename: 'learning-center/map.webp',
        });
        if (mounted && uri) setLocalMapUri(uri);
      } catch (e) {
        toast('getCachedFile failed, will use bundled asset' + e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {/* 小图 */}
      <Card>
        <TouchableOpacity
          onPress={() => setShowFullScreenMap(true)}
          className="w-full flex-row overflow-hidden rounded-xl"
          activeOpacity={0.7}
        >
          {localMapUri ? (
            <Image
              source={{ uri: localMapUri }}
              className="aspect-[4022/2475] w-full"
              accessible={true}
              accessibilityLabel="学习中心地图"
            />
          ) : (
            <View className="aspect-[4022/2475] w-full items-center justify-center bg-transparent">
              <Text className="text-center text-gray-400">首次使用，正在加载地图，请稍后！</Text>
            </View>
          )}
        </TouchableOpacity>
      </Card>

      {/* 大图 */}
      <Modal
        visible={showFullScreenMap}
        transparent={true}
        animationType="fade" // 添加过渡动画
        onRequestClose={() => setShowFullScreenMap(false)} // 支持Android返回键
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View className="flex-1 items-center justify-center bg-black/90">
          {/* 关闭按钮 */}
          <TouchableOpacity
            onPress={() => setShowFullScreenMap(false)}
            className={`absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20`}
            activeOpacity={0.7}
            style={{ top: insets.top + 14 }}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {localMapUri ? (
            <ImageZoom
              enableImageZoom={true}
              enableSwipeDown
              swipeDownThreshold={50}
              onSwipeDown={() => setShowFullScreenMap(false)}
              saveToLocalByLongPress={false} // 防止长按保存菜单
              style={styles.imageZoom}
              renderIndicator={() => <></>} // 修改为返回空的 React Fragment
              imageUrls={[{ url: localMapUri }]}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-gray-400">首次使用，正在加载地图，请稍后！</Text>
            </View>
          )}

          {/* 缩放提示 */}
          <View className="absolute bottom-6 left-0 right-0 items-center" style={{ bottom: insets.bottom + 16 }}>
            <Text className="text-xs text-text-secondary">双指缩放查看详情</Text>
          </View>
        </View>
      </Modal>
    </>
  );
});

LearningCenterMap.displayName = 'LearningCenterMap';

// ImageZoom 不支持 className，需要使用 style
const styles = StyleSheet.create({
  imageZoom: {
    width: '100%',
    height: '100%',
  },
});

export default LearningCenterMap;
