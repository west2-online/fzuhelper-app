import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
// 格式化日期
const formatDate = (date: Date, formatStr: string): string => {
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
};

// 计算两个时间之间的小时差
const calculateHoursDifference = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // 计算分钟差，然后转换为小时
  return (endMinutes - startMinutes) / 60;
};

// 添加指定小时到当前日期
const addHours = (date: Date, hours: number): Date => {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
};

const DateCard: React.FC<{
  date: Date;
  selectedDate: Date;
  onPress: () => void;
}> = ({ date, selectedDate, onPress }) => {
  // 判断日期是否选中
  const isSelected = formatDate(selectedDate, 'yyyy-MM-dd') === formatDate(date, 'yyyy-MM-dd');

  // 样式映射对象
  const styles = {
    container: isSelected ? 'bg-primary' : 'bg-secondary',
    dateText: isSelected ? 'text-primary-foreground' : 'text-foreground',
    weekText: isSelected ? 'text-primary-foreground' : 'text-text-secondary',
  };

  return (
    <Pressable onPress={onPress} className={`m-1 flex-1 rounded-lg p-3 ${styles.container}`}>
      <Text className={`text-center font-medium ${styles.dateText}`}>{date.getDate()}</Text>
      <Text className={`text-center text-xs ${styles.weekText}`}>{formatDate(date, 'EEE')}</Text>
    </Pressable>
  );
};

const TimeCard: React.FC<{
  time: string;
  disabled: boolean;
  isSelected: boolean;
  isInclude: boolean;
  onPress: () => void;
}> = ({ time, disabled, isSelected, isInclude, onPress }) => {
  // 样式映射对象
  const styles = {
    container: disabled
      ? 'bg-muted opacity-40' //如果被禁用，背景色为灰色
      : isSelected
        ? 'bg-primary' //如果被选中，背景色为主色
        : isInclude
          ? 'bg-primary/50' //如果被包含，背景色为主色的30%透明度
          : 'bg-secondary',

    timeText: disabled
      ? 'text-text-secondary' //如果被禁用，文字颜色为次文本色
      : isSelected
        ? 'text-primary-foreground' //如果被选中，文字颜色为主色
        : isInclude
          ? 'text-foreground' //如果被包含，文字颜色为主文本色
          : 'text-foreground',
  };

  return (
    <Pressable onPress={onPress} disabled={disabled} className={`m-1 flex-1 rounded-lg p-3 ${styles.container}`}>
      <Text className={`text-center ${styles.timeText}`}>{time}</Text>
    </Pressable>
  );
};

export default function SeatsPage() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [beginTime, setBeginTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  // 生成未来7天的日期
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => addHours(new Date(), 24 * index)), []);

  // 判断时间是否已过
  const isTimePast = useCallback((date: Date, timeStr: string): boolean => {
    const isToday = formatDate(date, 'yyyy-MM-dd') === formatDate(new Date(), 'yyyy-MM-dd');

    if (!isToday) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const [hour, minute] = timeStr.split(':').map(Number);

    if (currentHour > hour) return true;
    if (currentHour === hour && currentMinute >= minute) return true;

    return false;
  }, []);

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

  const handleCommit = useCallback(() => {
    // 格式化日期
    const formattedDate = formatDate(selectedDate, 'yyyy-MM-dd');

    // 由于Button在时间不合法直接disable，这里不需要再次判断
    // 导航到可用座位页面，传递选择的日期和时间
    router.push({
      pathname: '/toolbox/learning-center/available-seats',
      params: {
        date: formattedDate,
        beginTime,
        endTime,
        token,
      },
    });
  }, [selectedDate, beginTime, endTime, token]);

  return (
    <View className="p-2">
      <Stack.Screen options={{ title: '预约时间' }} />
      {/* 日期选择 */}
      <Text className="text-text mt-4 text-center text-sm">选择日期</Text>
      <FlatList
        className="flex-grow-0" // 限制高度
        data={dates}
        keyExtractor={item => formatDate(item, 'yyyy-MM-dd')}
        showsHorizontalScrollIndicator={false}
        numColumns={10}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <DateCard date={item} selectedDate={selectedDate} onPress={() => setSelectedDate(item)} />
        )}
      />
      <Text className="text-text mt-4 text-center text-sm">选择时间</Text>
      {/* 时间段选择 */}
      <FlatList
        className="flex-grow-0" // 限制高度
        data={timeSlots}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        numColumns={4}
        renderItem={({ item }) => (
          <TimeCard
            time={item}
            disabled={
              isTimePast(selectedDate, item) || (beginTime ? calculateHoursDifference(beginTime, item) > 4 : false)
            }
            isSelected={item === beginTime || item === endTime}
            isInclude={isInclude(item)}
            onPress={() => {
              handleTimeSelection(item);
            }}
          />
        )}
      />
      <Text>
        {beginTime && !endTime
          ? `已选择开始时间：${formatDate(selectedDate, 'yyyy年MM月dd日')} ${beginTime}`
          : beginTime && endTime
            ? `已选择时间段：${formatDate(selectedDate, 'yyyy年MM月dd日')} ${beginTime} - ${endTime}`
            : ''}
      </Text>
      <Button disabled={!beginTime || !endTime || beginTime > endTime} onPress={handleCommit}>
        <Text>确定</Text>
      </Button>
    </View>
  );
}
