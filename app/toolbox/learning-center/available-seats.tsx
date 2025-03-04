import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import ApiService from '@/utils/learning-center/api_service';
import React from 'react';

// 用于存储选中的座位号的键
const SELECTED_SEAT_KEY = 'learning_center_selected_seat';

// 座位展示选项卡类型
type TabType = 'all' | 'single';

const SeatChip = ({
  seat,
  onSelect,
}: {
  seat: { spaceName: string; status: number; isSingle?: boolean };
  onSelect: (seatName: string) => void;
}) => (
  <Button
    variant="outline"
    className="my-1 h-10 flex-row items-center justify-center"
    onPress={() => onSelect(seat.spaceName)}
  >
    <View className="w-full flex-row items-center justify-between">
      <Text className="font-medium">{seat.spaceName}</Text>
    </View>
  </Button>
);

// 选项卡按钮组件
const TabButton = ({ active, title, onPress }: { active: boolean; title: string; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-1 py-2 ${active ? 'border-b-2 border-primary' : 'border-b border-gray-200 dark:border-gray-800'}`}
  >
    <Text className={`text-center font-medium ${active ? 'text-primary' : 'text-text-secondary'}`}>{title}</Text>
  </TouchableOpacity>
);

// 统计卡片组件
const StatCard = ({
  title,
  value,
  variant = 'default',
}: {
  title: string;
  value: string;
  variant?: 'default' | 'primary' | 'success';
}) => {
  // 根据变体设置不同的样式
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'shadow-sm shadow-primary/25 border-primary/20';
      case 'success':
        return 'shadow-sm shadow-green-500/20 border-green-500/20';
      default:
        return 'shadow-sm shadow-gray-500/15 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <Card className={`overflow-hidden rounded-xl border ${getVariantStyles()}`}>
      <CardContent className="p-4">
        <View>
          <Text className="mb-1 text-xs text-text-secondary">{title}</Text>
          <Text className="text-lg font-bold">{value}</Text>
        </View>
      </CardContent>
    </Card>
  );
};

StatCard.displayName = 'StatCard';

const SeatList = React.memo(
  ({
    seats,
    columnsCount,
    onSelect,
  }: {
    seats: { spaceName: string; status: number }[];
    columnsCount: number;
    onSelect: (seatName: string) => void;
  }) => {
    if (seats.length === 0) {
      return (
        <View className="items-center justify-center py-8">
          <Text className="text-center text-text-secondary">
            暂无空闲座位
            {'\n'}
            （如果你在该时间段已有一个预约则可能无法显示，但仍然可以通过直接输入座位号的方式预约）
          </Text>
        </View>
      );
    }

    const renderItem = ({ item }: { item: { spaceName: string; status: number } }) => (
      <View style={{ width: `${100 / columnsCount}%` }} className="px-1">
        <SeatChip seat={item} onSelect={onSelect} />
      </View>
    );

    return (
      <FlatList
        data={seats}
        renderItem={renderItem}
        keyExtractor={item => item.spaceName}
        numColumns={columnsCount}
        showsVerticalScrollIndicator={false}
        className="pb-5"
      />
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.seats.length !== nextProps.seats.length) return false;
    return prevProps.seats.every(
      (seat, index) => nextProps.seats[index] && seat.spaceName === nextProps.seats[index].spaceName,
    );
  },
);

SeatList.displayName = 'SeatList';

export default function AvailableSeatsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    date?: string;
    startTime?: string;
    endTime?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [seats, setSeats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [statusSummary, setStatusSummary] = useState({
    total: 0,
    free: 0,
    freeSingle: 0,
  });

  const { date, startTime, endTime } = params;
  const screenWidth = Dimensions.get('window').width;
  const columnsCount = Math.floor((screenWidth - 32) / 110);

  // 计算并返回单人座位判断函数
  const isSingleSeat = useCallback((spaceName: string) => {
    const seatNum = parseInt(spaceName.match(/\d+/)?.[0] || '0', 10);
    return seatNum >= 205 && seatNum <= 476;
  }, []);

  // Wrap querySeatStatus in useCallback to fix the dependency issue
  const querySeatStatus = useCallback(async () => {
    if (!date || !startTime || !endTime) {
      toast.error('请先选择日期和时间');
      router.back();
      return;
    }

    setIsLoading(true);
    try {
      console.log(`开始查询座位: ${date} ${startTime}-${endTime}`);

      // 调用API获取所有楼层的座位信息
      const result = await ApiService.queryAllFloorSeats({
        date: date,
        beginTime: startTime,
        endTime: endTime,
      });

      console.log('查询结果:', result);

      if (result.success) {
        // 处理座位数据
        const seatsData = result.data || [];

        // 首先更新状态，快速展示UI
        setSeats(seatsData);

        // 计算统计信息
        const total = seatsData.length;
        const free = seatsData.filter(seat => seat.status === 0).length;

        // 计算单人座位数量
        const freeSingle = seatsData.filter(seat => seat.status === 0 && isSingleSeat(seat.spaceName)).length;

        console.log(`统计信息: 总座位=${total}, 空闲=${free}, 单人空闲=${freeSingle}`);

        // 更新统计信息
        setStatusSummary({
          total,
          free,
          freeSingle,
        });

        if (total === 0) {
          toast.info('未找到任何座位，也可能是该时段已有一个有效预约了');
        }
      } else {
        console.error('查询失败:', result.message);
        toast.error(result.message || '获取座位数据失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('查询座位出错:', errorMessage);
      toast.error(`查询失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [date, startTime, endTime, router, isSingleSeat]);

  // 提前处理和缓存所有座位数据，避免在切换选项卡时进行计算
  const { allFreeSeats, singleFreeSeats } = useMemo(() => {
    // 筛选所有空闲座位
    const allFree = seats.filter(seat => seat.status === 0);

    // 筛选单人空闲座位
    const singleFree = allFree.filter(seat => isSingleSeat(seat.spaceName));

    return {
      allFreeSeats: allFree,
      singleFreeSeats: singleFree,
    };
  }, [seats, isSingleSeat]);

  // 当前选中选项卡对应的座位
  const currentTabSeats = activeTab === 'single' ? singleFreeSeats : allFreeSeats;

  useEffect(() => {
    querySeatStatus();
  }, [date, startTime, endTime, querySeatStatus]);

  const handleSeatSelect = async (seatName: string) => {
    try {
      // 将选中的座位号保存到 AsyncStorage
      await AsyncStorage.setItem(SELECTED_SEAT_KEY, seatName);
      console.log('座位号已保存:', seatName);

      // 显示提示
      toast.success(`已选择座位: ${seatName}`);

      // 返回上一页
      router.back();
    } catch (error) {
      console.error('保存座位号时出错:', error);
      toast.error('选择座位失败，请重试');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '可用座位查询' }} />

      <PageContainer className="flex-1 bg-background px-4 pt-4">
        {isLoading && seats.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#666" />
            <Text className="mt-4 text-text-secondary">正在加载座位数据...（需要一点时间）</Text>
          </View>
        ) : (
          <FlatList
            data={[{ key: 'content' }]} // 使用单项数据，因为我们只需要渲染一次完整内容
            renderItem={() => (
              <View className="space-y-6 pb-6">
                {/* 查询信息卡片 */}
                <Card className="mb-4 rounded-xl p-4 shadow-sm">
                  <View className="mb-4 flex-row items-center">
                    <Text className="font-medium text-text-secondary">
                      {date} {startTime}-{endTime}
                    </Text>
                  </View>

                  <Button
                    onPress={querySeatStatus}
                    disabled={isLoading}
                    className="w-full flex-row items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" className="mr-2" />
                        <Text className="text-xs text-white">正在刷新...</Text>
                      </>
                    ) : (
                      <Text className="text-xs text-white">刷新数据</Text>
                    )}
                  </Button>
                </Card>

                {seats.length > 0 ? (
                  <View>
                    {/* 统计信息区域 */}
                    <Animated.View entering={FadeInDown.duration(300).delay(100)} className="mb-6 space-y-4">
                      <View className="flex-row gap-3">
                        <View className="flex-1">
                          <StatCard title="总座位" value={statusSummary.total.toString()} />
                        </View>
                        <View className="flex-1">
                          <StatCard
                            title="空闲座位"
                            value={`${statusSummary.free} (${Math.round((statusSummary.free / statusSummary.total) * 100)}%)`}
                            variant="primary"
                          />
                        </View>
                        <View className="flex-1">
                          <StatCard
                            title="空闲单人座位"
                            value={`${statusSummary.freeSingle} (${Math.round((statusSummary.freeSingle / statusSummary.total) * 100)}%)`}
                            variant="success"
                          />
                        </View>
                      </View>
                    </Animated.View>

                    <View className="mb-3 border-b border-border pb-3">
                      <View className="flex-row items-center">
                        <Text className="font-medium">空闲座位列表</Text>
                      </View>
                    </View>

                    {/* 选项卡切换 */}
                    <View className="mb-4 flex-row">
                      <TabButton active={activeTab === 'all'} title="全部" onPress={() => setActiveTab('all')} />
                      <TabButton
                        active={activeTab === 'single'}
                        title="单人座(205-476号)"
                        onPress={() => setActiveTab('single')}
                      />
                    </View>

                    {/* 显示座位数量信息 */}
                    <View className="mb-3">
                      <Text className="text-sm text-text-secondary">
                        {activeTab === 'all'
                          ? `共 ${allFreeSeats.length} 个空闲座位`
                          : `共 ${singleFreeSeats.length} 个空闲单人座位`}
                      </Text>
                    </View>

                    {/* 空闲座位列表 */}
                    <SeatList seats={currentTabSeats} columnsCount={columnsCount} onSelect={handleSeatSelect} />
                  </View>
                ) : (
                  <View className="items-center justify-center py-16">
                    <Text className="text-center text-text-secondary">暂无数据，请点击刷新按钮获取座位状态</Text>
                  </View>
                )}

                {/* 额外空间确保内容完全可滚动 */}
                <View className="mb-8 h-[50px]" />
              </View>
            )}
            keyExtractor={item => item.key}
            showsVerticalScrollIndicator={true}
            className="pb-5"
          />
        )}
      </PageContainer>
    </>
  );
}
