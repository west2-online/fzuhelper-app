import LearningCenterMap from '@/components/learning-center/learning-center-map';
import SeatCard from '@/components/learning-center/seat-card';
import Loading from '@/components/loading';
import { TabFlatList } from '@/components/tab-flatlist';
import FloatModal from '@/components/ui/float-modal';
import { Text } from '@/components/ui/text';
import ApiService from '@/utils/learning-center/api_service';
import { Stack, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { toast } from 'sonner-native';

// 座位分区表
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

// 获取座位所在区域
const getSpaceArea = (spaceName: string) => {
  const spaceNumber = Number(spaceName.split('-')[0]);
  const area = areas.find(([start, end]) => spaceNumber >= start && spaceNumber <= end);
  return area ? area[2] : '其他';
};

const styles = StyleSheet.create({
  columnWrapper: {
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});

// 座位列表为空时的组件
const ListEmptySeats: React.FC = memo(() => {
  return (
    <View className="flex-1 items-center justify-center py-8">
      <Text className="text-gray-500">
        暂无可用座位
        {'\n'}
        （或当前时间段已存在一个有效预约）
      </Text>
    </View>
  );
});

ListEmptySeats.displayName = 'ListEmptySeats';

type parmProps = {
  date: string;
  beginTime: string;
  endTime: string;
  token: string;
};

export default function AvailableSeatsPage() {
  const { date, beginTime, endTime, token } = useLocalSearchParams<parmProps>();
  const api = useMemo(() => new ApiService(token), [token]);
  const [seats, setSeats] = useState<Record<string, string[]>>({}); // 按区域分组的座位，只需要记录座位名
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState('4');

  // 确认预约弹层状态
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);

  // 计算座位卡片固定宽度
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = screenWidth / 5;

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

    // 筛选出所有的可用座位 并 按座位号排序
    const availableSeats = results
      .filter(seat => seat.spaceStatus === 0)
      .sort((a, b) => parseInt(a.spaceName, 10) - parseInt(b.spaceName, 10));

    // 对座位用getSpaceArea进行分区
    const newSeats: Record<string, string[]> = {};
    availableSeats.forEach(seat => {
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

  // 处理预约请求
  const handleConfirm = useCallback(async () => {
    try {
      await api.makeAppointment({
        date,
        beginTime,
        endTime,
        spaceName: selectedSpace!,
      });
      toast.success('预约成功');
    } catch (error: any) {
      toast.error(`预约座位失败: ${error.message}`);
    }
    setConfirmVisible(false);
  }, [api, date, beginTime, endTime, selectedSpace]);

  useEffect(() => {
    fetchSeatStatus();
  }, [fetchSeatStatus]);

  return (
    <>
      <Stack.Screen options={{ title: '可预约座位' }} />
      <View className="mx-2 my-3 overflow-hidden rounded-2xl">
        <LearningCenterMap />
      </View>

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
                renderItem={({ item }) => (
                  <View style={{ width: itemWidth }}>
                    <SeatCard spaceName={item} onPress={() => handleSeatPress(item)} />
                  </View>
                )}
                keyExtractor={item => item}
                numColumns={5}
                initialNumToRender={50}
                ListEmptyComponent={ListEmptySeats}
                columnWrapperStyle={styles.columnWrapper}
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
          onConfirm={handleConfirm}
        >
          <View className="space-y-8 px-2 py-6">
            {/* 预约信息卡片 */}
            <View className="rounded-xl bg-gray-50 p-5">
              <View className="mb-6">
                <Text className="mb-2 text-sm text-gray-400">预约日期</Text>
                <Text className="text-xl font-medium">{date}</Text>
              </View>

              <View className="mb-6">
                <Text className="mb-2 text-sm text-gray-400">预约时段</Text>
                <Text className="text-xl font-medium">
                  {beginTime} - {endTime}
                </Text>
              </View>

              <View>
                <Text className="mb-2 text-sm text-gray-400">座位号码</Text>
                <Text className="text-xl font-medium">{selectedSpace}</Text>
              </View>
            </View>

            {/* 确认提示 */}
            <View className="px-4 py-2">
              <Text className="text-center text-base text-blue-600">请确认以上信息无误</Text>
            </View>
          </View>
        </FloatModal>
      )}
    </>
  );
}
