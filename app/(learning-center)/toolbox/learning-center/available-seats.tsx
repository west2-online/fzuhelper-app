import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import ConfirmReservationModal from '@/components/learning-center/confirm-reservation-modal';
import LearningCenterMap from '@/components/learning-center/learning-center-map';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import LearningCenterSeatsList from '@/components/learning-center-seats-list';
import { useLearningCenterApi } from '@/context/learning-center';
import type { SeatData } from '@/types/learning-center';
import { SeatMappingUtil } from '@/utils/learning-center/seat-mapping';

type parmProps = {
  date: string;
  beginTime: string;
  endTime: string;
};

// 座位列表为空时的组件
const ListEmptySeats: React.FC = memo(() => (
  <PageContainer>
    <View className="flex-1 items-center justify-center py-8">
      <Text className="text-center text-text-secondary">
        暂无座位数据，请稍后重试
        {'\n'}
        （或当前时间段已存在一个有效预约）
      </Text>
    </View>
  </PageContainer>
));

ListEmptySeats.displayName = 'ListEmptySeats';

export default function AvailableSeatsPage() {
  const { date, beginTime, endTime } = useLocalSearchParams<parmProps>();
  const api = useLearningCenterApi();
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // 确认预约弹层状态
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);

  // 获取数据
  const fetchSeatStatus = useCallback(
    async (date: string, begin: string, end: string) => {
      setIsRefreshing(true);

      const results = (
        await Promise.all(
          ['4', '5'].map(floor =>
            api
              .querySeatStatus({
                date,
                beginTime: begin,
                endTime: end,
                floor,
              })
              .catch(error => {
                console.error(`查询 ${floor} 层座位失败`, error);
                toast.error(`查询 ${floor} 层座位失败，请稍后重试。`);
                return [];
              }),
          ),
        )
      )
        .flat()
        // 对所有座位按座位号排序
        .sort((a, b) => parseInt(a.spaceName, 10) - parseInt(b.spaceName, 10))
        // 过滤掉包含 "-" 字符的非法座位
        .filter(seat => !seat.spaceName.includes('-'));

      // 更新数据
      setSeats(results.map(seat => ({ spaceName: seat.spaceName, spaceStatus: seat.spaceStatus })));

      setIsRefreshing(false);
    },
    [api],
  );

  // 跳转到座位时间段查看页面
  const pushToSeatTimeStatus = useCallback(
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
            isOccupied: isOccupied ? '1' : '0', // 传递座位占用状态
          },
        });
      } catch (error) {
        console.error('获取座位ID失败', error);
        toast.error('该座位已被占用，无法查看详情');
      }
    },
    [router, date],
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
        pushToSeatTimeStatus(spaceName, true); // 传递占用状态为true
      }
    },
    [pushToSeatTimeStatus],
  );

  // 处理预约请求
  const handleConfirm = useCallback(
    async (begin: string, end: string, selected: string) => {
      try {
        await api.makeAppointment({
          date,
          beginTime: begin,
          endTime: end,
          spaceName: selected,
        });
        toast.success('预约成功');
        // 跳转到预约历史页面
        router.replace('/toolbox/learning-center/history');
      } catch (error: any) {
        toast.error(`预约失败: ${error.message}`);
        // 不需要提供预约失败字样，因为错误信息已经包含了
      } finally {
        setConfirmVisible(false);
      }
    },
    [api, date, router],
  );

  useEffect(() => {
    fetchSeatStatus(date, beginTime, endTime);
  }, [fetchSeatStatus, date, beginTime, endTime]);

  // 如果没有座位数据，且不是正在刷新状态，则说明没有座位数据
  if (!seats.length && !isRefreshing) {
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
              <LearningCenterSeatsList data={seats} onSeatPress={handleSeatPress} />
            </View>
          </>
        )}

        {/* 确认预约的浮层 */}
        <ConfirmReservationModal
          visible={confirmVisible}
          onClose={() => setConfirmVisible(false)}
          onConfirm={() => handleConfirm(beginTime, endTime, selectedSpace!)}
          onViewStatus={selectedSpace ? () => pushToSeatTimeStatus(selectedSpace, false) : undefined} // 传递占用状态为false
          date={date}
          beginTime={beginTime}
          endTime={endTime}
          selectedSpace={selectedSpace}
        />
      </PageContainer>
    </>
  );
}
