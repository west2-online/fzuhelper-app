import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

import { LEARNING_CENTER_TOKEN_KEY } from '@/lib/constants';

function formatDate(date: Date, formatStr: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[date.getDay()];

  switch (formatStr) {
    case 'yyyy-MM-dd':
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    case 'MM/dd':
      return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    case 'EEE':
      return `周${weekDay}`;
    case 'yyyy年MM月dd日':
      return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日`;
    default:
      return date.toLocaleDateString();
  }
}

function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isDateBefore(date1: Date, date2: Date): boolean {
  return date1 < date2;
}

// 设置时间
function setTime(date: Date, hours: number, minutes: number): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

// 新增函数：计算两个时间之间的小时差
function calculateHoursDifference(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // 计算分钟差，然后转换为小时
  return (endMinutes - startMinutes) / 60;
}

export default function SeatsPage() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setToken] = useState<string | null>(null);

  // 日期和时间选择状态
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [selectedTimeStep, setSelectedTimeStep] = useState<'start' | 'end'>('start');
  const { token } = useLocalSearchParams<{ token: string }>();
  // 生成未来7天的日期
  const dates = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      result.push(addDaysToDate(now, i));
    }
    return result;
  }, []);

  // 生成从8:00到22:30的时间段，每30分钟一个时间点
  const timeSlots = useMemo(() => {
    const slots = [];
    let hour = 8;
    let minute = 0;

    while (hour < 23 || (hour === 22 && minute === 30)) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      slots.push(`${formattedHour}:${formattedMinute}`);

      minute += 30;
      if (minute === 60) {
        hour += 1;
        minute = 0;
      }
    }
    return slots;
  }, []);

  // 检查时间段是否应该被禁用
  const isTimeSlotDisabled = (time: string) => {
    // 如果选择的是今天，禁用早于当前时间的时间段
    if (formatDate(selectedDate, 'yyyy-MM-dd') === formatDate(new Date(), 'yyyy-MM-dd')) {
      const [hours, minutes] = time.split(':').map(Number);
      const timeDate = setTime(new Date(), hours, minutes);
      return isDateBefore(timeDate, new Date());
    }
    return false;
  };

  // 处理时间选择
  const handleTimeSelection = (time: string) => {
    if (selectedTimeStep === 'start') {
      setStartTime(time);
      setEndTime(null);
      setSelectedTimeStep('end');
    } else {
      // 确保结束时间晚于开始时间
      if (startTime && time > startTime) {
        // 检查时长是否超过4小时
        const hoursDifference = calculateHoursDifference(startTime, time);

        if (hoursDifference > 4) {
          toast.error('预约时间不能超过4小时');
          // 重置选择
          setStartTime(null);
          setEndTime(null);
          setSelectedTimeStep('start');
        } else {
          setEndTime(time);
          setSelectedTimeStep('start');
        }
      } else {
        toast.error('结束时间必须晚于开始时间');
        // 重置选择
        setStartTime(null);
        setEndTime(null);
        setSelectedTimeStep('start');
      }
    }
  };

  // 获取时间格子的样式类
  const getTimeSlotClassName = (time: string) => {
    const disabled = isTimeSlotDisabled(time);

    if (disabled) {
      return 'bg-muted opacity-40';
    } else if (time === startTime) {
      return 'bg-primary';
    } else if (time === endTime) {
      return 'bg-primary';
    } else if (startTime && endTime && time > startTime && time < endTime) {
      return 'bg-primary/30'; // 开始和结束时间之间的时段
    } else {
      return 'bg-secondary';
    }
  };

  // 获取时间格子内文字的样式类
  const getTimeSlotTextClassName = (time: string) => {
    const disabled = isTimeSlotDisabled(time);
    if (disabled) {
      return 'text-text-secondary';
    } else if (time === startTime || time === endTime) {
      return 'text-primary-foreground';
    } else if (startTime && endTime && time > startTime && time < endTime) {
      return 'text-foreground';
    } else {
      return 'text-foreground';
    }
  };

  const timeSlotsRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < timeSlots.length; i += 4) {
      rows.push(timeSlots.slice(i, i + 4));
    }
    return rows;
  }, [timeSlots]);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(LEARNING_CENTER_TOKEN_KEY);
        if (savedToken) {
          setToken(savedToken);
        }
      } catch (error) {
        toast.error(`检查令牌时出错: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [router]);

  // 导航到可用座位页面，传递日期和时间参数
  const navigateToAvailableSeats = () => {
    if (!selectedDate || !startTime || !endTime) {
      toast.error('请先选择日期和时间');
      return;
    }

    // 格式化日期
    const formattedDate = formatDate(selectedDate, 'yyyy-MM-dd');

    // 导航到可用座位页面，传递选择的日期和时间
    router.push({
      pathname: '/toolbox/learning-center/available-seats',
      params: {
        date: formattedDate,
        startTime,
        endTime,
        token,
      },
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Stack.Screen options={{ title: '预约座位' }} />

      <PageContainer className="bg-background px-4 pt-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 as number }}
          keyboardVerticalOffset={50}
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            <View className="space-y-6 pb-6">
              {/* 日期选择 */}
              <Card className="p-4">
                <Text className="mb-3 font-medium">选择日期</Text>
                <View className="flex-row justify-between">
                  {dates.map((date, index) => (
                    <Pressable
                      key={index}
                      onPress={() => setSelectedDate(date)}
                      className={`rounded-lg p-3 ${
                        formatDate(selectedDate, 'yyyy-MM-dd') === formatDate(date, 'yyyy-MM-dd')
                          ? 'bg-primary'
                          : 'bg-secondary'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          formatDate(selectedDate, 'yyyy-MM-dd') === formatDate(date, 'yyyy-MM-dd')
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {date.getDate()}
                      </Text>
                      <Text
                        className={`text-center text-xs ${
                          formatDate(selectedDate, 'yyyy-MM-dd') === formatDate(date, 'yyyy-MM-dd')
                            ? 'text-primary-foreground'
                            : 'text-text-secondary'
                        }`}
                      >
                        {formatDate(date, 'EEE')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Card>

              {/* 时间段选择 */}
              <Card className="p-4">
                <Text className="mb-3 font-medium">
                  选择时间段 - {selectedTimeStep === 'start' ? '点击选择开始时间' : '点击选择结束时间'}
                </Text>

                <View className="space-y-10">
                  {timeSlotsRows.map((row, rowIndex) => (
                    <View key={rowIndex} className="mb-2 flex-row justify-between">
                      {row.map(time => {
                        const disabled = isTimeSlotDisabled(time);
                        const endTimeDisabled = selectedTimeStep === 'end' && startTime && time <= startTime;
                        const isDisabled = disabled || endTimeDisabled;

                        return (
                          <Pressable
                            key={time}
                            onPress={() => !isDisabled && handleTimeSelection(time)}
                            className={`mx-1 flex-1 rounded-lg p-3 ${getTimeSlotClassName(time)} ${isDisabled ? 'opacity-40' : ''}`}
                            disabled={Boolean(isDisabled)}
                          >
                            <Text className={`text-center ${getTimeSlotTextClassName(time)}`}>{time}</Text>
                          </Pressable>
                        );
                      })}

                      {/* 填充空白位置保持每行4个的布局 */}
                      {Array(4 - row.length)
                        .fill(0)
                        .map((_, index) => (
                          <View key={`filler-${index}`} className="mx-1 flex-1 rounded-lg p-3 opacity-0">
                            <Text className="invisible text-center">00:00</Text>
                          </View>
                        ))}
                    </View>
                  ))}
                </View>
              </Card>

              {/* 时间段选择状态指示 */}
              {startTime && (
                <Text className="text-text text-center text-sm">
                  {startTime && !endTime
                    ? `已选择开始时间：${formatDate(selectedDate, 'yyyy年MM月dd日')} ${startTime}`
                    : startTime && endTime
                      ? `已选择时间段：${formatDate(selectedDate, 'yyyy年MM月dd日')} ${startTime} - ${endTime}`
                      : ''}
                </Text>
              )}

              <Button disabled={!startTime || !endTime} onPress={navigateToAvailableSeats} className="mt-4">
                <Text className="text-white">查询可用座位</Text>
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </PageContainer>
    </>
  );
}
