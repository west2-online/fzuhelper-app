import { Stack, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import DateCard from '@/components/learning-center/date-card';
import TimeCard from '@/components/learning-center/time-card';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { addHours, calculateHoursDifference, formatDate, isTimePast } from '@/utils/learning-center/date';

export default function SeatsPage() {
  // 修改默认日期，如果当前时间晚于或等于22:00则为次日
  const now = new Date();
  const defaultDate = now.getHours() >= 22 ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) : now;
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [beginTime, setBeginTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  // 生成未来7天的日期
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => addHours(new Date(), 24 * index)), []);

  // 生成时间段 8:00 - 22:30 每隔30分钟
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

  // 判断时间是否在选择的时间段内
  const isInclude = useCallback(
    (time: string) => {
      if (beginTime && endTime) {
        return time > beginTime && time < endTime;
      }
      return false;
    },
    [beginTime, endTime],
  );

  const getTimeCardState = useCallback(
    (time: string): 'disabled' | 'selected' | 'included' | 'default' => {
      if (isTimePast(selectedDate, time) || (beginTime && calculateHoursDifference(beginTime, time) > 4)) {
        return 'disabled';
      }

      if (time === beginTime || time === endTime) {
        return 'selected';
      }

      if (isInclude(time)) {
        return 'included';
      }

      return 'default';
    },
    [selectedDate, beginTime, endTime, isInclude],
  );

  // 处理时间点击事件
  const handleTimeSelection = (time: string) => {
    // 1. 开始：无 结束：无 点击-> 设置开始时间
    // 2. 开始：有 结束：无 点击-> 判断
    //   2.1 点击的时间比开始时间早，清除开始时间，设置新的开始时间
    //   2.2 点击的时间比开始时间晚，设置结束时间
    //   2.3 点击的时间和开始时间相同，清除开始时间
    // 3. 开始：有 结束：有 点击-> 清除开始和结束时间
    // 时间先后问题在push的时候进行判断

    if (!beginTime && !endTime) {
      setBeginTime(time);
    } else if (beginTime && !endTime) {
      if (time < beginTime) {
        setBeginTime(time);
      } else if (time > beginTime) {
        setEndTime(time);
      } else {
        setBeginTime(null);
      }
    } else {
      setBeginTime(null);
      setEndTime(null);
    }
  };

  // 处理确认按钮点击事件
  const handleCommit = useCallback(() => {
    // 格式化日期
    const formattedDate = formatDate(selectedDate, 'YYYY-MM-DD');

    // 由于Button在时间不合法直接disable，这里不需要再次判断
    // 导航到可用座位页面，传递选择的日期和时间
    router.replace({
      pathname: '/toolbox/learning-center/available-seats',
      params: {
        date: formattedDate,
        beginTime,
        endTime,
      },
    });
  }, [selectedDate, beginTime, endTime]);

  return (
    <PageContainer>
      <View className="p-2">
        <Stack.Screen options={{ title: '选择时间段' }} />

        {/* 日期选择 */}
        <FlatList
          data={dates}
          keyExtractor={item => formatDate(item, 'YYYY-MM-DD')}
          showsHorizontalScrollIndicator={false}
          numColumns={10}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <DateCard
              date={item.getDate().toString()}
              day={formatDate(item, 'EEE')}
              onPress={() => {
                setSelectedDate(item);
                setBeginTime(null);
                setEndTime(null);
              }}
              state={formatDate(selectedDate, 'YYYY-MM-DD') === formatDate(item, 'YYYY-MM-DD') ? 'selected' : 'default'}
            />
          )}
        />
        <Text className="my-4 text-center">请选择时间段</Text>

        {/* 时间段选择 */}
        <FlatList
          data={timeSlots}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          numColumns={4}
          columnWrapperClassName="flex flex-wrap justify-start w-full"
          renderItem={({ item, index }) => (
            <View className="w-1/4">
              <TimeCard time={item} state={getTimeCardState(item)} onPress={() => handleTimeSelection(item)} />
            </View>
          )}
        />

        {/* 底部提示 */}
        <Text className="my-4 flex text-center">
          {beginTime && !endTime
            ? ``
            : beginTime && endTime
              ? `已选择时间段 ${formatDate(selectedDate, 'YYYY年MM月DD日')} ${beginTime} - ${endTime}`
              : ''}
        </Text>
        <View className="mx-2 justify-between">
          <Button disabled={!beginTime || !endTime || beginTime > endTime} onPress={handleCommit}>
            <Text>确定</Text>
          </Button>
        </View>
      </View>
    </PageContainer>
  );
}
