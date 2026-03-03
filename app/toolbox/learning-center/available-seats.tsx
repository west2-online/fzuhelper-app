import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
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

// 无法获取到座位信息的提示
const ListEmptySeats: React.FC = memo(() => (
  <PageContainer>
    <View className="flex-1 items-center justify-center py-8">
      <Text className="text-center text-text-secondary">
        无法获取到座位信息
        {'\n'}
        学习中心服务器压力有限，请稍后重试
      </Text>
    </View>
  </PageContainer>
));

ListEmptySeats.displayName = 'ListEmptySeats';

// 所有座位都不可用的提示
const AllSeatsUnavailable: React.FC = memo(() => (
  <PageContainer>
    <View className="flex-1 items-center justify-center py-8">
      <Text className="text-center text-text-secondary">
        当前时段所有座位都不可用
        {'\n\n'}
        可能是如下原因：{'\n'}
        1. 当前时间段存在有效预约，请尝试其他时间段{'\n'}
        2. 学习中心服务器压力过大，无法提供座位信息{'\n'}
        3. 学习中心因竞赛等活动，场地占用暂停开放{'\n'}
        4. 因违规行为个人账户被封禁，无法预约座位{'\n'}
      </Text>
    </View>
  </PageContainer>
));

AllSeatsUnavailable.displayName = 'AllSeatsUnavailable';

export default function AvailableSeatsPage() {
  const { date, beginTime, endTime } = useLocalSearchParams<parmProps>();
  const api = useLearningCenterApi();
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allSeatsUnavailable, setAllSeatsUnavailable] = useState(false);
  const router = useRouter();
  // 添加中止控制器引用，用于退出时取消重复尝试的请求
  const abortControllerRef = useRef<AbortController | null>(null);

  const isMountedRef = useRef(true);

  // 计算地图显示宽度
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(windowWidth - 42, 550);

  // 确认预约弹层状态
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);

  // 获取数据
  const fetchSeatStatus = useCallback(
    async (paramDate: string, begin: string, end: string) => {
      // 如果有正在进行的请求，则取消
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsRefreshing(true);

      const floors = ['4', '5'];
      let results: SeatData[] = [];
      let failedFloors: string[] = [...floors];
      let currentRetry = 0;

      try {
        // 尝试查询座位状态，每个楼层最多重试5次
        while (failedFloors.length > 0 && currentRetry < 5 && !signal.aborted) {
          if (currentRetry > 0) {
            // 使用toast通知显示重试信息
            if (isMountedRef.current) {
              toast.warning(`学习中心状态异常，正在第 ${currentRetry} 次重试`);
            }
          }

          const newFailedFloors: string[] = [];

          const floorResults = await Promise.all(
            failedFloors.map(async floor => {
              try {
                // 检查是否已取消
                if (signal.aborted) {
                  throw new DOMException('请求已取消', 'AbortError');
                }

                const data = await api.querySeatStatus({
                  date: paramDate,
                  beginTime: begin,
                  endTime: end,
                  floor,
                });

                if (!data || data.length === 0) {
                  newFailedFloors.push(floor);
                  return { floor, data: [] };
                }
                return { floor, data };
              } catch (error: any) {
                // 检查是否是中断错误
                if (
                  signal.aborted ||
                  error.name === 'AbortError' ||
                  (error.message && error.message.includes('canceled'))
                ) {
                  throw new DOMException('请求已取消', 'AbortError');
                }

                console.error(`查询 ${floor} 层座位失败`, error);
                if (currentRetry === 4 && isMountedRef.current) {
                  toast.error(`查询 ${floor} 层座位失败，请稍后重试。`);
                }
                newFailedFloors.push(floor);
                return { floor, data: [] };
              }
            }),
          );

          if (signal.aborted) {
            throw new DOMException('请求已取消', 'AbortError');
          }

          // 收集成功查询的楼层数据
          floorResults.forEach(result => {
            if (result.data.length > 0) {
              results = [...results, ...result.data];
            }
          });

          // 更新失败的楼层列表
          failedFloors = newFailedFloors;

          // 如果还有失败的楼层，继续重试
          if (failedFloors.length > 0) {
            currentRetry++;
            if (currentRetry < 5) {
              await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(resolve, 1000); // 等待1秒再重试

                // 如果在等待期间请求被取消，清除定时器并拒绝
                const abortHandler = () => {
                  clearTimeout(timeoutId);
                  reject(new DOMException('请求已取消', 'AbortError'));
                };

                signal.addEventListener('abort', abortHandler, { once: true });

                setTimeout(() => {
                  signal.removeEventListener('abort', abortHandler);
                }, 1000);
              });
            }
          }
        }

        // 在五次尝试后，如果只获取到部分楼层的信息，显示toast提示
        if (failedFloors.length > 0 && isMountedRef.current) {
          // 只有部分楼层数据获取成功
          const successFloors = floors.filter(floor => !failedFloors.includes(floor));
          if (successFloors.length > 0 && failedFloors.length > 0) {
            // 提示哪些楼层未能获取到
            toast.warning(`${failedFloors.join('、')}层座位信息获取失败`);
          }
        }

        // 对所有座位按座位号排序并过滤无效座位
        const processedResults = results
          .flat()
          // 对所有座位按座位号排序
          .sort((a, b) => parseInt(a.spaceName, 10) - parseInt(b.spaceName, 10))
          // 过滤掉包含 "-" 字符的非法座位
          .filter(seat => !seat.spaceName.includes('-'));

        // 更新数据
        if (isMountedRef.current) {
          setSeats(processedResults.map(seat => ({ spaceName: seat.spaceName, spaceStatus: seat.spaceStatus })));

          // 统计可用和不可用的座位数量
          const availableSeats = processedResults.filter(seat => Number(seat.spaceStatus) === 0).length;
          const totalSeats = processedResults.length;

          console.log(
            `座位统计: 总共 ${totalSeats} 个座位, 可用 ${availableSeats} 个, 不可用 ${totalSeats - availableSeats} 个`,
          );

          // 如果所有座位都不可用，设置状态变量
          if (totalSeats > 0 && availableSeats === 0) {
            setAllSeatsUnavailable(true);
          } else {
            setAllSeatsUnavailable(false);
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError' && isMountedRef.current) {
          toast.error('查询座位状态失败，请稍后重试');
        }
        console.error('查询座位状态失败', error);
      } finally {
        if (isMountedRef.current) {
          setIsRefreshing(false);
        }
      }
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
    isMountedRef.current = true;
    fetchSeatStatus(date, beginTime, endTime);

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchSeatStatus, date, beginTime, endTime]);

  // 如果没有座位数据，且不是正在刷新状态，则说明没有座位数据
  if (!seats.length && !isRefreshing) {
    return <ListEmptySeats />;
  }

  // 如果所有座位都不可用，显示提示
  if (allSeatsUnavailable) {
    return <AllSeatsUnavailable />;
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
            <View className="mx-2 my-3 self-center overflow-hidden rounded-2xl" style={{ width: contentWidth }}>
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
