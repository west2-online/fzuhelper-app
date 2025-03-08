import Loading from '@/components/loading';
import { TabFlatList } from '@/components/tab-flatlist';
import { Card, CardContent } from '@/components/ui/card';
import FloatModal from '@/components/ui/float-modal';
import { Text } from '@/components/ui/text';
import ApiService from '@/utils/learning-center/api_service';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, Image, Modal, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
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
      className="m-1 flex h-20 flex-1 items-center justify-center rounded-lg bg-secondary shadow-md"
    >
      <Text>{spaceName}</Text>
    </TouchableOpacity>
  );
});
SeatCard.displayName = 'SeatCard';

const areas: [number, number, string][] = [
  [1, 204, 'J'],
  [205, 268, 'A'],
  [269, 368, 'B'],
  [369, 416, 'D'],
  [417, 476, 'C'],
  [477, 616, 'I'],
  [617, 640, 'F'],
  [641, 736, 'H'],
  [737, 758, 'G'],
  [759, 804, 'E'],
  [805, 837, 'K'],
  [838, 870, 'L'],
  [871, 919, 'M'],
];

const getSpaceArea = (spaceName: string) => {
  const spaceNumber = Number(spaceName.split('-')[0]);
  const area = areas.find(([start, end]) => spaceNumber >= start && spaceNumber <= end);
  return area ? area[2] : '其他';
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

// 座位列表为空时的组件
const ListEmptySeats = React.memo(() => {
  return (
    <View className="flex-1 items-center justify-center py-8">
      <Text className="text-gray-500">暂无可用座位</Text>
    </View>
  );
});
ListEmptySeats.displayName = 'ListEmptySeats';

export default function AvailableSeatsPage() {
  const { date, beginTime, endTime, token } = useLocalSearchParams<{
    date: string;
    beginTime: string;
    endTime: string;
    token: string;
  }>();
  const api = useMemo(() => new ApiService(token), [token]);
  const [seats, setSeats] = useState<Record<string, string[]>>({}); // 按区域分组的座位，只需要记录座位名
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
    const newSeats: Record<string, string[]> = {};
    results.forEach(seat => {
      const area = getSpaceArea(seat.spaceName);
      if (!newSeats[area]) {
        newSeats[area] = [];
      }
      newSeats[area].push(seat.spaceName);
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

  useEffect(() => {
    fetchSeatStatus();
  }, [fetchSeatStatus]);

  return (
    <>
      <Stack.Screen options={{ title: '可预约座位' }} />
      <LearningCenterMap />

      {/* 座位列表 */}
      {isRefreshing ? (
        <Loading />
      ) : (
        <TabFlatList
          data={Object.keys(seats).sort()}
          value={currentTab}
          onChange={setCurrentTab}
          flatListOptions={{
            // TabFlatList的配置项
            initialNumToRender: 3, // 初始化渲染的tab数量
          }}
          renderContent={area => (
            <View style={{ width: Dimensions.get('window').width }}>
              <FlatList
                data={seats[area] || []}
                removeClippedSubviews={true}
                renderItem={({ item }) => <SeatCard spaceName={item} onPress={() => handleSeatPress(item)} />}
                keyExtractor={item => item}
                numColumns={5}
                // getItemLayout={(data, index) => ({
                //   length: 70,
                //   offset: 50 * index,
                //   index,
                // })}
                initialNumToRender={50}
                ListEmptyComponent={ListEmptySeats}
              />
            </View>
          )}
        />
      )}

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
