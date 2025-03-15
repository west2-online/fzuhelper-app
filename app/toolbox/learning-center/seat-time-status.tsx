import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import FloatModal from '@/components/ui/float-modal';
import { Text } from '@/components/ui/text';
import ApiService, { TimeDiamond } from '@/utils/learning-center/api-service';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';

type SeatTimeStatusParams = {
  spaceId: string;
  date: string;
  spaceName: string;
  token: string;
};

export default function SeatTimeStatusPage() {
  const { spaceId, date, spaceName, token } = useLocalSearchParams<SeatTimeStatusParams>();
  const [loading, setLoading] = useState<boolean>(true);
  const [timeDiamondList, setTimeDiamondList] = useState<TimeDiamond[]>([]);
  const router = useRouter();

  // 时间选择相关状态
  const [beginTime, setBeginTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  // 确认预约浮层状态
  const [confirmVisible, setConfirmVisible] = useState(false);

  const api = useMemo(() => {
    return token ? new ApiService(token) : null;
  }, [token]);

  // 获取座位时间段数据
  useEffect(() => {
    const fetchSeatTimeStatus = async () => {
      if (!api || !spaceId || !date) return;

      try {
        setLoading(true);
        const response = await api.querySpaceAppointTime({
          spaceId,
          date,
        });
        setTimeDiamondList(response.data.timeDiamondList);
      } catch (error) {
        console.error('获取座位时间段失败', error);
        toast.error('获取座位时间段数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchSeatTimeStatus();
  }, [api, spaceId, date]);

  // 根据占用状态返回对应的样式类名
  const getTimeBlockStyle = (item: TimeDiamond) => {
    // 已占用
    if (item.occupy === 1) {
      return styles.occupiedBlock;
    }

    // 被选为开始或结束时间
    if (item.timeText === beginTime || item.timeText === endTime) {
      return styles.selectedBlock;
    }

    // 在开始和结束时间之间
    if (beginTime && endTime && item.timeText > beginTime && item.timeText < endTime) {
      return styles.includedBlock;
    }

    // 默认可用
    return styles.availableBlock;
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
      router.replace({ pathname: '/toolbox/learning-center/history', params: { token } });
    } catch (error: any) {
      toast.error(`预约失败: ${error.message}`);
    }
    setConfirmVisible(false);
  }, [api, date, beginTime, endTime, spaceName, router, token]);

  return (
    <>
      <Stack.Screen options={{ title: `#${spaceName || '座位'} 可用时段` }} />
      <PageContainer>
        {loading ? (
          <Loading />
        ) : (
          <ScrollView className="flex-1 px-4 py-2">
            <View className="mb-4">
              <Text className="text-lg font-semibold">座位号: {spaceName}</Text>
              <Text className="text-base text-gray-500">日期: {date}</Text>
            </View>

            {/* 图例说明 */}
            <View className="mb-4 flex-row flex-wrap items-center">
              <View className="mb-2 mr-4 flex-row items-center">
                <View style={[styles.legendBox, styles.availableBlock]} />
                <Text className="ml-2">可预约</Text>
              </View>
              <View className="mb-2 mr-4 flex-row items-center">
                <View style={[styles.legendBox, styles.occupiedBlock]} />
                <Text className="ml-2">已占用</Text>
              </View>
              <View className="mb-2 mr-4 flex-row items-center">
                <View style={[styles.legendBox, styles.selectedBlock]} />
                <Text className="ml-2">已选择</Text>
              </View>
              <View className="mb-2 flex-row items-center">
                <View style={[styles.legendBox, styles.includedBlock]} />
                <Text className="ml-2">选择区间</Text>
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
                  style={[styles.timeBlock, getTimeBlockStyle(item)]}
                  disabled={item.occupy === 1}
                  onPress={() => handleTimeSelection(item.timeText, item.occupy)}
                >
                  <Text
                    style={[styles.timeText, item.occupy === 1 ? styles.occupiedTimeText : styles.availableTimeText]}
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
                  <Text className="text-xl font-medium">{date}</Text>
                </View>

                <View className="mb-6">
                  <Text className="mb-2 text-sm text-primary">预约时段</Text>
                  <Text className="text-xl font-medium">
                    {beginTime} - {endTime}
                  </Text>
                </View>

                <View>
                  <Text className="mb-2 text-sm text-primary">座位号码</Text>
                  <Text className="text-xl font-medium">{spaceName}</Text>
                </View>
              </View>
            </View>
          </FloatModal>
        )}
      </PageContainer>
    </>
  );
}

const styles = StyleSheet.create({
  timeBlock: {
    width: '23%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    marginRight: '2%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableBlock: {
    backgroundColor: '#e6f7e9',
    borderColor: '#4ade80',
    borderWidth: 1,
  },
  occupiedBlock: {
    backgroundColor: '#fee2e2',
    borderColor: '#f87171',
    borderWidth: 1,
  },
  selectedBlock: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  includedBlock: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
    borderWidth: 1,
  },
  timeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  availableTimeText: {
    color: '#111827',
  },
  occupiedTimeText: {
    color: '#9ca3af',
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
});
