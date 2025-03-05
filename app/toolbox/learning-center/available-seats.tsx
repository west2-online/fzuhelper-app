import { SeatStatusData } from '@/utils/learning-center/api_service';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import ImageZoom from 'react-native-image-zoom-viewer';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import ApiService from '@/utils/learning-center/api_service';
import React from 'react';

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

const SeatList = React.memo(
  ({
    seats,
    columnsCount,
    onSelect,
  }: {
    seats: SeatStatusData[];
    columnsCount: number;
    onSelect: (seatName: string) => void;
  }) => {
    if (seats.length === 0) {
      return (
        <View className="items-center justify-center py-8">
          <Text className="text-center text-text-secondary">暂无空闲座位</Text>
        </View>
      );
    }

    const renderItem = ({ item }: { item: SeatStatusData }) => (
      <View style={{ width: `${100 / columnsCount}%` }} className="px-1">
        <SeatChip seat={{ spaceName: item.spaceName, status: item.spaceStatus }} onSelect={onSelect} />
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
  const [seats, setSeats] = useState<SeatStatusData[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [statusSummary, setStatusSummary] = useState({
    total: 0,
    free: 0,
    freeSingle: 0,
  });
  const [selectedSeat, setSelectedSeat] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSeatsList, setShowSeatsList] = useState(true);
  const scrollViewRef = useRef<FlatList>(null);
  const isInitialRender = useRef(true);

  const { date, startTime, endTime } = params;
  const screenWidth = Dimensions.get('window').width;
  const columnsCount = Math.floor((screenWidth - 32) / 110);
  const { token } = useLocalSearchParams<{ token: string }>(); // 从路由参数中获取token
  const api = useMemo(() => new ApiService(token), [token]);

  // 计算并返回单人座位判断函数
  const isSingleSeat = useCallback((spaceName: string) => {
    const seatNum = parseInt(spaceName.match(/\d+/)?.[0] || '0', 10);
    return seatNum >= 205 && seatNum <= 476;
  }, []);

  // 查询所有的座位状态
  const querySeatStatus = useCallback(async () => {
    if (!date || !startTime || !endTime) {
      toast.error('请先选择日期和时间');
      router.back();
      return;
    }
    setIsLoading(true);

    try {
      // 并发请求所有楼层的座位信息
      const floors = ['4', '5'] as const;
      const seatPromises = floors.map(floor =>
        api
          .querySeatStatus({
            date,
            beginTime: startTime,
            endTime: endTime,
            floor,
          })
          .catch(error => {
            toast.error(`查询${floor}楼座位失败，请稍后重试`);
            return [];
          }),
      );
      const seatResult = await Promise.all(seatPromises);
      const allSeats = seatResult.flat();
      setSeats(allSeats);

      // 计算统计信息
      setStatusSummary({
        total: seats.length,
        free: seats.filter(seat => seat.spaceStatus === 0).length,
        freeSingle: seats.filter(seat => seat.spaceStatus === 0 && isSingleSeat(seat.spaceName)).length,
      });

      if (seats.length === 0) {
        toast.info('未找到任何座位，也可能是该时段已有一个有效预约了');
      }
    } catch (error: any) {
      toast.error(`加载数据失败，请稍后重试${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  // 提前处理和缓存所有座位数据，避免在切换选项卡时进行计算
  const { allFreeSeats, singleFreeSeats } = useMemo(() => {
    // 筛选所有空闲座位
    const allFree = seats.filter(seat => seat.spaceStatus === 0);

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
    if (isInitialRender.current) {
      querySeatStatus();
      isInitialRender.current = false;
    }
  }, [querySeatStatus]);

  // 处理座位选择
  const handleSeatSelect = (seatName: string) => {
    setSelectedSeat(seatName);
    setShowSeatsList(false); // 收起座位列表
    // 使用React Native的滚动方法
    scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // 返回座位列表
  const handleBackToSeatList = () => {
    setSelectedSeat('');
    setShowSeatsList(true);
  };

  // 处理预约提交
  const handleSubmitAppointment = async () => {
    if (!date || !startTime || !endTime || !selectedSeat) {
      toast.error('请选择座位');
      return;
    }

    setIsSubmitting(true);

    try {
      // 调用API进行预约
      await api.makeAppointment({
        spaceName: selectedSeat,
        beginTime: startTime,
        endTime: endTime,
        date: date,
      });

      // 预约成功
      toast.success('座位预约成功！');

      // 跳转到预约历史页面
      router.push('/toolbox/learning-center/history');
    } catch (error: any) {
      // 显示预约失败的具体原因
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 格式化日期为用户友好格式
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${year}年${month}月${day}日`;
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
            ref={scrollViewRef}
            data={[{ key: 'content' }]} // 使用单项数据，因为我们只需要渲染一次完整内容
            renderItem={() => (
              <View className="space-y-6 pb-6">
                {/* 学习中心地图 */}
                <LearningCenterMap />

                {/* 查询信息卡片 */}
                {selectedSeat ? null : (
                  <Card className="mb-4 rounded-xl p-4 shadow-sm">
                    <View className="mb-4 flex-row items-center">
                      <Text className="font-medium text-text-secondary">
                        {formatDate(date)} {startTime}-{endTime}
                      </Text>
                    </View>
                    {selectedSeat ? (
                      <Button onPress={handleBackToSeatList} className="w-full flex-row items-center justify-center">
                        <Text className="text-xs text-white">返回座位列表</Text>
                      </Button>
                    ) : (
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
                    )}
                  </Card>
                )}

                {selectedSeat ? (
                  // 座位预约确认区域
                  <View className="space-y-6">
                    <View className="space-y-4">
                      <Card className="mb-4 rounded-xl p-4">
                        <View>
                          <Text className="mb-4 text-lg font-semibold">预约详情</Text>
                          <View className="space-y-4">
                            <View className="flex-row items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-900">
                              <Text className="text-text-primary">日期</Text>
                              <Text className="font-medium">{formatDate(date)}</Text>
                            </View>
                            <View className="flex-row items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-900">
                              <Text className="text-text-primary">时间</Text>
                              <Text className="font-medium">
                                {startTime} - {endTime}
                              </Text>
                            </View>
                            <View className="flex-row items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-900">
                              <Text className="text-text-primary">座位号</Text>
                              <Text className="font-medium">{selectedSeat}</Text>
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity onPress={handleBackToSeatList} className="mt-4 w-full items-center">
                          <Text className="text-primary underline">重选座位</Text>
                        </TouchableOpacity>
                      </Card>
                      <Button onPress={handleSubmitAppointment} disabled={isSubmitting} className="mt-4">
                        <Text className="text-white">{isSubmitting ? '预约中...' : '确认预约'}</Text>
                      </Button>
                    </View>
                  </View>
                ) : (
                  // 座位列表区域
                  showSeatsList &&
                  seats.length > 0 && (
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
                  )
                )}

                {!selectedSeat && seats.length === 0 && !isLoading && (
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
