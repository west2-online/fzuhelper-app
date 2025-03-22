import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import FloatModal from '@/components/ui/float-modal';
import { Text } from '@/components/ui/text';
import { useLearningCenterApi } from '@/context/learning-center';
import { TimeDiamond } from '@/utils/learning-center/api-service';
import dayjs from 'dayjs';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';

type SeatTimeStatusParams = {
  spaceId: string;
  date: string;
  spaceName: string;
  isOccupied?: string;
  // 新增参数：座位是否被占用
  // 部分可能在维修的座位在根据时间查询座位中会显示为已占用，但是在根据座位号查询时会显示为所有时间段均可用
  // 这里我们需要根据这个参数来判断座位是否异常，当所有时间段均可用时，且 isOccupied === '1'，则说明该座位异常
};

export default function SeatTimeStatusPage() {
  const { spaceId, date, spaceName, isOccupied } = useLocalSearchParams<SeatTimeStatusParams>();
  const [loading, setLoading] = useState<boolean>(true);
  const [timeDiamondList, setTimeDiamondList] = useState<TimeDiamond[]>([]);
  const [isSeatUnusual, setIsSeatUnusual] = useState<boolean>(false);
  const router = useRouter();

  // 时间选择相关状态
  const [beginTime, setBeginTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  // 确认预约浮层状态
  const [confirmVisible, setConfirmVisible] = useState(false);

  const api = useLearningCenterApi();

  // 获取座位时间段数据
  useEffect(() => {
    const fetchSeatTimeStatus = async () => {
      if (!spaceId || !date) return;

      try {
        setLoading(true);
        const response = await api.querySpaceAppointTime({
          spaceId,
          date,
        });

        // 获取时间段列表
        let timeList = [...response.data.timeDiamondList];

        // 检查是否所有时间段都是空闲的
        const allFree = timeList.length > 0 && timeList.every(item => item.occupy === 0);

        // 只有当前座位已被占用（isOccupied === '1'）且所有时间段都是空闲的，才判断为座位异常
        setIsSeatUnusual(allFree && isOccupied === '1');

        // 如果是当天，则将当前时间之前的时间段标记为已占用
        const isToday = dayjs().format('YYYY-MM-DD') === date;
        if (isToday) {
          const currentTime = dayjs().format('HH:mm');
          timeList = timeList.map(item => {
            if (item.timeText < currentTime) {
              return { ...item, occupy: 1 };
            }
            return item;
          });
        }

        setTimeDiamondList(timeList);
      } catch (error) {
        console.error('获取座位时间段失败', error);
        toast.error('获取座位时间段数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchSeatTimeStatus();
  }, [api, spaceId, date, isOccupied]);

  const getTimeBlockStyle = (item: TimeDiamond) => {
    // 基础样式
    let baseStyle = 'w-[23%] p-3 rounded-lg mb-2.5 mr-[2%] items-center justify-center ';

    // 已占用
    if (item.occupy === 1) {
      return baseStyle + 'bg-[#fee2e2]/80 dark:bg-[#fee2e2]/30 border border-[#f87171]/80';
    }

    // 被选为开始或结束时间
    if (item.timeText === beginTime || item.timeText === endTime) {
      return baseStyle + 'bg-[#dbeafe]/80 dark:bg-[#dbeafe]/80 border border-[#3b82f6]/80';
    }

    // 在开始和结束时间之间
    if (beginTime && endTime && item.timeText > beginTime && item.timeText < endTime) {
      return baseStyle + 'bg-[#eff6ff]/80 dark:bg-[#eff6ff]/60 border border-[#93c5fd]/80';
    }

    // 默认可用
    return baseStyle + 'bg-[#e6f7e9]/80 dark:bg-[#e6f7e9]/40 border border-[#4ade80]/80';
  };

  // 处理时间点击事件
  const handleTimeSelection = (time: string, occupy: number) => {
    // 如果座位已占用，不允许选择
    if (occupy === 1) return;

    if (!beginTime && !endTime) {
      setBeginTime(time);
    } else if (beginTime && !endTime) {
      if (time < beginTime) {
        setBeginTime(time);
      } else if (time > beginTime) {
        // 计算时间差（小时）
        const calculateHoursDifference = (start: string, end: string) => {
          const [startHour, startMinute] = start.split(':').map(Number);
          const [endHour, endMinute] = end.split(':').map(Number);
          return endHour - startHour + (endMinute - startMinute) / 60;
        };

        const hoursDifference = calculateHoursDifference(beginTime, time);

        // 检查是否超过4小时
        if (hoursDifference > 4) {
          toast.error('预约时间不能超过4小时，请重新选择');
          return;
        }

        // 检查从开始到结束的所有时间段是否都可用
        const isAllAvailable = timeDiamondList
          .filter(item => item.timeText > beginTime && item.timeText <= time)
          .every(item => item.occupy === 0);

        if (isAllAvailable) {
          setEndTime(time);
        } else {
          toast.error('选择的时间段内有已被占用的时间点，请重新选择');
        }
      } else {
        setBeginTime(null);
      }
    } else {
      setBeginTime(null);
      setEndTime(null);
    }
  };

  // 检查是否可以预约
  const canMakeAppointment = useMemo(() => {
    return beginTime !== null && endTime !== null;
  }, [beginTime, endTime]);

  // 点击预约按钮
  const handleAppointment = useCallback(() => {
    if (!canMakeAppointment) return;
    setConfirmVisible(true);
  }, [canMakeAppointment]);

  // 确认预约
  const handleConfirm = useCallback(async () => {
    try {
      if (!api || !beginTime || !endTime || !spaceName) {
        toast.error('预约信息不完整');
        return;
      }

      await api.makeAppointment({
        date,
        beginTime,
        endTime,
        spaceName,
      });

      toast.success('预约成功');
      // 跳转到预约历史页面
      router.replace('/toolbox/learning-center/history');
    } catch (error: any) {
      toast.error(`预约失败: ${error.message}`);
    }
    setConfirmVisible(false);
  }, [api, date, beginTime, endTime, spaceName, router]);

  return (
    <>
      <Stack.Screen options={{ title: `#${spaceName || '座位'} 可用时段` }} />
      <PageContainer>
        {loading ? (
          <Loading />
        ) : (
          <ScrollView className="flex-1 px-4 py-2">
            <View className="mb-4">
              <Text className="text-lg font-semibold text-text-primary">座位号: {spaceName}</Text>
              <Text className="text-base text-text-secondary">日期: {date}</Text>
            </View>

            {/* 座位异常警告 */}
            {isSeatUnusual ? (
              <View className="mb-4 rounded-lg bg-yellow-200 p-4 dark:bg-yellow-900/30">
                <Text className="text-center text-yellow-800 dark:text-yellow-200">
                  该座位异常，可能是处于维修状态，不可预约
                </Text>

                {/* 返回按钮 */}
                <View className="mt-4">
                  <Button onPress={() => router.back()}>
                    <Text className="font-medium text-white">返回选座</Text>
                  </Button>
                </View>
              </View>
            ) : (
              <>
                {/* 图例说明 */}
                <View className="mb-4 flex-row flex-wrap items-center">
                  <View className="mb-2 mr-4 flex-row items-center">
                    <View className="h-4 w-4 rounded border border-[#4ade80] bg-[#e6f7e9]" />
                    <Text className="ml-2 text-text-primary">可预约</Text>
                  </View>
                  <View className="mb-2 mr-4 flex-row items-center">
                    <View className="h-4 w-4 rounded border border-[#f87171] bg-[#fee2e2]" />
                    <Text className="ml-2 text-text-primary">已占用</Text>
                  </View>
                  <View className="mb-2 mr-4 flex-row items-center">
                    <View className="h-4 w-4 rounded border border-[#3b82f6] bg-[#dbeafe]" />
                    <Text className="ml-2 text-text-primary">已选择</Text>
                  </View>
                  <View className="mb-2 flex-row items-center">
                    <View className="h-4 w-4 rounded border border-[#93c5fd] bg-[#eff6ff]" />
                    <Text className="ml-2 text-text-primary">选择区间</Text>
                  </View>
                </View>

                {/* 选择提示 */}
                <View className="mb-4">
                  <Text className="text-center text-primary">
                    {!beginTime && !endTime
                      ? '请选择开始时间'
                      : beginTime && !endTime
                        ? '请选择结束时间'
                        : `已选择 ${beginTime} - ${endTime}`}
                  </Text>
                </View>

                {/* 时间块网格 */}
                <View className="flex-row flex-wrap justify-start">
                  {timeDiamondList.map(item => (
                    <TouchableOpacity
                      key={item.index}
                      className={getTimeBlockStyle(item)}
                      disabled={item.occupy === 1}
                      onPress={() => handleTimeSelection(item.timeText, item.occupy)}
                    >
                      <Text
                        className={`mb-1 w-full text-center text-base ${
                          item.occupy === 1
                            ? 'text-text-secondary'
                            : item.timeText === beginTime || item.timeText === endTime
                              ? 'font-medium text-primary'
                              : 'text-text-primary'
                        }`}
                      >
                        {item.timeText}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 预约按钮 */}
                {canMakeAppointment && (
                  <View className="mt-8 px-4">
                    <Button onPress={handleAppointment}>
                      <Text className="font-medium text-white">立即预约</Text>
                    </Button>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}

        {/* 确认预约的浮层 */}
        {confirmVisible && (
          <FloatModal
            visible={confirmVisible}
            title="确认预约"
            onClose={() => setConfirmVisible(false)}
            onConfirm={handleConfirm}
          >
            <View className="space-y-8 px-2">
              {/* 预约信息卡片 */}
              <View className="rounded-xl p-5">
                <View className="mb-6">
                  <Text className="mb-2 text-sm text-primary">预约日期</Text>
                  <Text className="text-xl font-medium text-text-primary">{date}</Text>
                </View>

                <View className="mb-6">
                  <Text className="mb-2 text-sm text-primary">预约时段</Text>
                  <Text className="text-xl font-medium text-text-primary">
                    {beginTime} - {endTime}
                  </Text>
                </View>

                <View>
                  <Text className="mb-2 text-sm text-primary">座位号码</Text>
                  <Text className="text-xl font-medium text-text-primary">{spaceName}</Text>
                </View>
              </View>
            </View>
          </FloatModal>
        )}
      </PageContainer>
    </>
  );
}
