import { Card, CardContent } from '@/components/ui/card';
import FloatModal from '@/components/ui/float-modal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import ApiService, { SeatStatusData } from '@/utils/learning-center/api_service';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import ImageZoom from 'react-native-image-zoom-viewer';
import { toast } from 'sonner-native';
// 座位卡片组件

const SeatCard: React.FC<{
  spaceName: string;
  onPress: () => void;
}> = React.memo(({ spaceName, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="m-1 flex h-20 flex-1 items-center justify-center rounded-lg bg-slate-50 shadow-md"
    >
      <Text>{spaceName}</Text>
    </TouchableOpacity>
  );
});
SeatCard.displayName = 'SeatCard';

// 根据spaceName对座位进行分区
// A: 205-268
// B: 269-368
// C: 417-476
// D: 369-416
// E: 759-804
// F: 617-640
// G: 737-758
// H: 641-736
// I: 477-616
// J: 001-204
// K: 805-837
// L: 838-870
// M: 871-919
const getSpaceArea = (spaceName: string) => {
  const spaceNumber = parseInt(spaceName, 10);
  if (spaceNumber >= 205 && spaceNumber <= 268) {
    return 'A';
  } else if (spaceNumber >= 269 && spaceNumber <= 368) {
    return 'B';
  } else if (spaceNumber >= 417 && spaceNumber <= 476) {
    return 'C';
  } else if (spaceNumber >= 369 && spaceNumber <= 416) {
    return 'D';
  } else if (spaceNumber >= 759 && spaceNumber <= 804) {
    return 'E';
  } else if (spaceNumber >= 617 && spaceNumber <= 640) {
    return 'F';
  } else if (spaceNumber >= 737 && spaceNumber <= 758) {
    return 'G';
  } else if (spaceNumber >= 641 && spaceNumber <= 736) {
    return 'H';
  } else if (spaceNumber >= 477 && spaceNumber <= 616) {
    return 'I';
  } else if (spaceNumber >= 1 && spaceNumber <= 204) {
    return 'J';
  } else if (spaceNumber >= 805 && spaceNumber <= 837) {
    return 'K';
  } else if (spaceNumber >= 838 && spaceNumber <= 870) {
    return 'L';
  } else if (spaceNumber >= 871 && spaceNumber <= 919) {
    return 'M';
  } else {
    return '其他';
  }
};

// 学习中心地图组件
// TODO: 地图目前还是半成品
const LearningCenterMap = () => {
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const imageWidth = screenWidth - 32;
  const imageHeight = 200;

  return (
    <Card className="mb-4 w-full overflow-hidden rounded-xl">
      <CardContent className="p-0">
        <TouchableOpacity onPress={() => setShowFullScreenMap(true)}>
          <Image
            source={require('@/assets/images/toolbox/learning-center/map.jpg')}
            style={{ width: imageWidth, height: imageHeight }}
            accessible={true}
            accessibilityLabel="学习中心地图"
          />
        </TouchableOpacity>
        <Modal visible={showFullScreenMap} transparent={true} onRequestClose={() => setShowFullScreenMap(false)}>
          <TouchableWithoutFeedback onPress={() => setShowFullScreenMap(false)}>
            <View className="flex-1 items-center justify-center bg-black/90">
              <TouchableOpacity
                className="absolute right-4 top-4 rounded-full bg-white/20 p-2"
                onPress={() => setShowFullScreenMap(false)}
              >
                <Text className="text-white">×</Text>
              </TouchableOpacity>
              <View className="h-4/5 w-full" onStartShouldSetResponder={() => true}>
                <ImageZoom
                  enableImageZoom={true}
                  enableSwipeDown
                  swipeDownThreshold={50}
                  onSwipeDown={() => setShowFullScreenMap(false)}
                  onClick={() => {}}
                  imageUrls={[
                    {
                      url: '',
                      props: {
                        source: require('@/assets/images/toolbox/learning-center/map.jpg'),
                      },
                    },
                  ]}
                  renderImage={props => <Image {...props} resizeMode="contain" />}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </CardContent>
    </Card>
  );
};

export default function AvailableSeatsPage() {
  const { date, beginTime, endTime, token } = useLocalSearchParams<{
    date: string;
    beginTime: string;
    endTime: string;
    token: string;
  }>();
  const api = useMemo(() => new ApiService(token), [token]);
  const [seats, setSeats] = useState<Record<string, SeatStatusData[]>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState('4');

  // 确认预约弹层状态
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);

  // 获取数据
  const fetchSeatStatus = useCallback(async () => {
    setIsRefreshing(true);
    const ALL_FLOORS = ['4', '5'] as const;
    const allPromises = ALL_FLOORS.map(floor =>
      api
        .querySeatStatus({
          date,
          beginTime,
          endTime,
          floor,
        })
        .catch(error => {
          toast.error(`查询${floor}楼座位失败，请稍后重试`);
          return [];
        }),
    );
    const results = (await Promise.all(allPromises)).flat();

    // 对座位用getSpaceArea进行分区
    const newSeats: Record<string, SeatStatusData[]> = {};
    results.forEach(seat => {
      const area = getSpaceArea(seat.spaceName);
      if (!newSeats[area]) {
        newSeats[area] = [];
      }
      newSeats[area].push(seat);
    });

    // 更新数据
    setSeats(newSeats);

    setIsRefreshing(false);
  }, [date, beginTime, endTime, api]);

  // 选中座位
  const handleSeatPress = useCallback((spaceName: string) => {
    setSelectedSpace(spaceName);
    setConfirmVisible(true);
  }, []);
  const currentTabData = useMemo(
    () => seats[currentTab].sort((a, b) => parseInt(a.spaceName, 10) - parseInt(b.spaceName, 10)) || [],
    [seats, currentTab],
  );

  useEffect(() => {
    fetchSeatStatus();
  }, [fetchSeatStatus]);

  return (
    <>
      <Stack.Screen options={{ title: '可预约座位' }} />
      <LearningCenterMap />

      {/* 选项卡 */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabsList className="flex-row">
            {Object.keys(seats)
              .sort()
              .map(area => (
                <TabsTrigger key={area} value={area} className="items-center">
                  <Text className="text-center">{area}</Text>
                </TabsTrigger>
              ))}
          </TabsList>
        </ScrollView>
      </Tabs>

      {/* 座位列表 不用TabFlatList的原因是性能过于捉急 */}
      <FlatList
        refreshing={isRefreshing}
        onRefresh={fetchSeatStatus}
        data={currentTabData}
        renderItem={({ item }) => (
          <SeatCard spaceName={item.spaceName} onPress={() => handleSeatPress(item.spaceName)} />
        )}
        keyExtractor={item => item.spaceName}
        numColumns={5}
        initialNumToRender={50}
        windowSize={10}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 80, // height of item
          offset: 80 * Math.floor(index / 5),
          index,
        })}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-gray-500">暂无可用座位</Text>
          </View>
        )}
      />

      {/* 确认预约的浮层 */}
      {confirmVisible && (
        <FloatModal
          visible={confirmVisible}
          title="确认预约"
          onClose={() => setConfirmVisible(false)}
          onConfirm={async () => {
            await api
              .makeAppointment({
                date,
                beginTime,
                endTime,
                spaceName: selectedSpace!,
              })
              .catch(error => {
                toast.error(`预约座位失败: ${error.message}`);
              })
              .then(() => {
                toast.success('预约成功');
              });
            setConfirmVisible(false);
          }}
        >
          <Text>日期: {date}</Text>
          <Text>
            时间: {beginTime} - {endTime}
          </Text>
          <Text>是否预约 {selectedSpace} 座位？</Text>
        </FloatModal>
      )}
    </>
  );
}
