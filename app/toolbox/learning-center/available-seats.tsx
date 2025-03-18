import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, View } from 'react-native';
import { toast } from 'sonner-native';

import ConfirmReservationModal from '@/components/learning-center/confirm-reservation-modal';
import LearningCenterMap from '@/components/learning-center/learning-center-map';
import SeatCard from '@/components/learning-center/seat-card';
import SeatOverview from '@/components/learning-center/seat-overview';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { TabFlatList } from '@/components/tab-flatlist';
import { Text } from '@/components/ui/text';

import ApiService from '@/utils/learning-center/api-service';
import { SeatMappingUtil } from '@/utils/learning-center/seat-mapping';
import { SeatAreaCharts, SpaceStatus, convertSpaceName } from '@/utils/learning-center/seats';

type parmProps = {
  date: string;
  beginTime: string;
  endTime: string;
  token: string;
};

type SeatData = {
  spaceName: string;
  spaceStatus: number; // 0为未占用，1为已占用
};

// 获取座位所在区域
const getSpaceArea = (spaceName: string) => {
  const spaceNumber = Number(spaceName.split('-')[0]);
  const area = SeatAreaCharts.find(([start, end]) => spaceNumber >= start && spaceNumber <= end);
  return area ? area[2] : '其他';
};

// 座位列表为空时的组件
const ListEmptySeats: React.FC = memo(() => {
  return (
    <PageContainer>
      <View className="flex-1 items-center justify-center py-8">
        <Text className="text-center text-text-secondary">
          暂无座位数据，请稍后重试
          {'\n'}
          （或当前时间段已存在一个有效预约）
        </Text>
      </View>
    </PageContainer>
  );
});

ListEmptySeats.displayName = 'ListEmptySeats';

export default function AvailableSeatsPage() {
  const { date, beginTime, endTime, token } = useLocalSearchParams<parmProps>();
  const api = useMemo(() => new ApiService(token), [token]);
  const [seats, setSeats] = useState<Record<string, SeatData[]>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState('4');
  const router = useRouter();
  const [onlyAvailable] = useState(false); // 仅显示可用座位

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
          console.error(`查询${floor}楼座位失败`, error);
          toast.error(`查询${floor}楼座位失败，请稍后重试`);
          return [];
        }),
    );
    const results = (await Promise.all(allPromises)).flat();

    // 对所有座位按座位号排序
    let allSeats = results.sort((a, b) => parseInt(a.spaceName, 10) - parseInt(b.spaceName, 10));

    // 过滤掉包含 "-" 字符的非法座位
    allSeats = allSeats.filter(seat => !seat.spaceName.includes('-'));

    // 如果只显示可用座位，过滤掉已占用的座位
    if (onlyAvailable === true) {
      allSeats = allSeats.filter(seat => seat.spaceStatus === SpaceStatus.Available);
    }

    // 对座位用getSpaceArea进行分区，保留座位状态信息
    const newSeats: Record<string, SeatData[]> = {};
    allSeats.forEach(seat => {
      const area = getSpaceArea(seat.spaceName);
      if (!newSeats[area]) {
        newSeats[area] = [];
      }
      newSeats[area].push({
        spaceName: seat.spaceName,
        spaceStatus: seat.spaceStatus,
      });
    });

    // 更新数据
    setSeats(newSeats);

    setIsRefreshing(false);
  }, [date, beginTime, endTime, api, onlyAvailable]);

  // 跳转到座位时间段查看页面
  const puthToSeatTimeStatus = useCallback(
    async (spaceName: string, isOccupied: boolean = true) => {
      try {
        // 初始化座位映射并获取spaceId
        await SeatMappingUtil.initialize();
        const spaceId = SeatMappingUtil.convertSeatNameToId(spaceName);
        if (!spaceId) {
          toast.error('无效的座位号');
          return;
        }

        // 跳转到座位时间段查看页面
        router.push({
          pathname: '/toolbox/learning-center/seat-time-status',
          params: {
            spaceId,
            date,
            spaceName,
            token,
            isOccupied: isOccupied ? '1' : '0', // 传递座位占用状态
          },
        });
      } catch (error) {
        console.error('获取座位ID失败', error);
        toast.error('该座位已被占用，无法查看详情');
      }
    },
    [router, date, token],
  );

  // 选中座位
  const handleSeatPress = useCallback(
    async (spaceName: string, isAvailable: boolean) => {
      // 如果座位可用，显示预约确认弹窗
      if (isAvailable) {
        setSelectedSpace(spaceName);
        setConfirmVisible(true);
      } else {
        // 如果座位已被占用，跳转到座位时间段查看页面
        puthToSeatTimeStatus(spaceName, true); // 传递占用状态为true
      }
    },
    [puthToSeatTimeStatus],
  );

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
      // 跳转到预约历史页面
      // router.back(); // 回到上一个地方
      router.replace({ pathname: '/toolbox/learning-center/history', params: { token } });
    } catch (error: any) {
      toast.error(`预约失败: ${error.message}`);
      // 不需要提供预约失败字样，因为错误信息已经包含了
    }
    setConfirmVisible(false);
  }, [api, date, beginTime, endTime, selectedSpace, router, token]);

  useEffect(() => {
    fetchSeatStatus();
  }, [fetchSeatStatus]);

  // 计算每个区域的座位总数和可用座位数
  const getSeatsSummary = useCallback((areaSeats: SeatData[]) => {
    if (!areaSeats || areaSeats.length === 0) return { total: 0, available: 0, occupied: 0 };

    const total = areaSeats.length;
    const available = areaSeats.filter(seat => seat.spaceStatus === SpaceStatus.Available).length;
    const occupied = total - available;

    return { total, available, occupied };
  }, []);

  // 如果没有座位数据，且不是正在刷新状态，则说明没有座位数据
  if (Object.keys(seats).length === 0 && !isRefreshing) {
    return <ListEmptySeats />;
  }

  return (
    <>
      <Stack.Screen options={{ title: '座位状态' }} />
      <PageContainer>
        {/* 座位列表 */}
        {isRefreshing ? (
          <Loading />
        ) : (
          <>
            <View className="mx-2 my-3 overflow-hidden rounded-2xl">
              <LearningCenterMap />
              {/* <LabelSwitch
                label="仅显示可用座位"
                value={onlyAvailable}
                onValueChange={() => {
                  setOnlyAvailable(prev => !prev);
                }}
              /> */}
            </View>
            <View className="flex-1">
              <TabFlatList
                data={Object.keys(seats).sort()}
                value={currentTab}
                onChange={setCurrentTab}
                flatListOptions={{
                  // TabFlatList的配置项
                  initialNumToRender: 10, // 初始化渲染的tab数量
                }}
                renderContent={area => (
                  <View style={{ width: screenWidth }}>
                    {/* 座位概览信息 */}
                    <SeatOverview area={area} seats={seats} getSeatsSummary={getSeatsSummary} />
                    <FlatList
                      data={seats[area] || []}
                      removeClippedSubviews={true}
                      renderItem={({ item }) => (
                        <View style={{ width: itemWidth }}>
                          <SeatCard
                            spaceName={convertSpaceName(item.spaceName)}
                            onPress={() => handleSeatPress(item.spaceName, item.spaceStatus === 0)}
                            isAvailable={item.spaceStatus === 0}
                          />
                        </View>
                      )}
                      keyExtractor={item => item.spaceName}
                      numColumns={5}
                      initialNumToRender={50}
                      ListEmptyComponent={ListEmptySeats}
                      columnWrapperClassName="flex flex-wrap justify-start"
                      contentContainerClassName="pb-[34px]"
                    />
                  </View>
                )}
              />
            </View>
          </>
        )}

        {/* 确认预约的浮层 */}
        <ConfirmReservationModal
          visible={confirmVisible}
          onClose={() => setConfirmVisible(false)}
          onConfirm={handleConfirm}
          onViewStatus={selectedSpace ? () => puthToSeatTimeStatus(selectedSpace, false) : undefined} // 传递占用状态为false
          date={date}
          beginTime={beginTime}
          endTime={endTime}
          selectedSpace={selectedSpace}
        />
      </PageContainer>
    </>
  );
}
