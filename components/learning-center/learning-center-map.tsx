import { Card } from '@/components/ui/card';
import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import ImageZoom from 'react-native-image-zoom-viewer';
// 学习中心地图组件
// TODO: 地图目前还是半成品
const LearningCenterMap = memo(() => {
  const [showFullScreenMap, setShowFullScreenMap] = useState(false); //控制是否展示全屏地图

  return (
    <>
      {/* 小图 */}
      <Card>
        <TouchableOpacity
          onPress={() => setShowFullScreenMap(true)}
          className="mb-4 w-full flex-row overflow-hidden rounded-xl"
        >
          <Image
            source={require('@/assets/images/toolbox/learning-center/map.jpg')}
            style={styles.mapImage}
            accessible={true}
            accessibilityLabel="学习中心地图"
          />
        </TouchableOpacity>
      </Card>

      {/* 大图 */}
      <Modal
        visible={showFullScreenMap}
        transparent={true}
        animationType="fade" // 添加过渡动画
        onRequestClose={() => setShowFullScreenMap(false)} // 支持Android返回键
      >
        <View className="flex-1 items-center justify-center bg-black/90">
          {/* 关闭按钮 */}
          <TouchableOpacity
            onPress={() => setShowFullScreenMap(false)}
            // 适配iOS状态栏高度
            className={`absolute right-4 ${
              Platform.OS === 'ios' ? 'top-12' : `top-${(StatusBar.currentHeight || 0) + 4}`
            } z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20`}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <ImageZoom
            enableImageZoom={true}
            enableSwipeDown
            swipeDownThreshold={50}
            onSwipeDown={() => setShowFullScreenMap(false)}
            onClick={() => {}}
            saveToLocalByLongPress={false} // 防止长按保存菜单
            style={styles.imageZoom}
            renderIndicator={() => <></>} // 修改为返回空的 React Fragment
            imageUrls={[
              {
                url: '',
                props: {
                  source: require('@/assets/images/toolbox/learning-center/map.jpg'),
                },
              },
            ]}
          />

          {/* 缩放提示 */}
          <View className="absolute bottom-6 left-0 right-0 items-center">
            <Text className="text-xs text-white/70">双指缩放或捏合可放大查看详情</Text>
          </View>
        </View>
      </Modal>
    </>
  );
});

LearningCenterMap.displayName = 'LearningCenterMap';

const styles = StyleSheet.create({
  mapImage: {
    width: '100%',
    aspectRatio: 4022 / 2475,
  },
  imageZoom: {
    width: '100%',
    height: '100%',
  },
});

export default LearningCenterMap;
