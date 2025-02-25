import PageContainer from '@/components/page-container';
import FloatModal from '@/components/ui/float-modal';
import { Text } from '@/components/ui/text';
import { type IntRange } from '@/types/int-range';
import { Stack } from 'expo-router';
import { CalendarDaysIcon } from 'lucide-react-native';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { TouchableOpacity, useColorScheme } from 'react-native';
import DateTimePicker, { getDefaultClassNames } from 'react-native-ui-datepicker';

const campus = ['旗山', '铜盘', '晋江', '泉港', '怡山', '鼓浪屿', '集美'];
const TIMEZONE = 'Asia/shanghai';

interface LessonRange {
  start: IntRange<1, 12>;
  end: IntRange<1, 12>;
}

interface DateNavigatorProps {
  date: DateTime;
  onPress: () => void;
}

function DateNavigator({ date, onPress }: DateNavigatorProps) {
  const currentColorScheme = useColorScheme();
  return (
    <TouchableOpacity className="flex-row items-center" onPress={onPress}>
      <Text className="pr-2 text-lg">{date.toFormat('yyyy-MM-dd')}</Text>
      <CalendarDaysIcon size={20} color={currentColorScheme === 'dark' ? 'white' : 'black'} />
    </TouchableOpacity>
  );
}

export default function EmptyRoomPage() {
  const today = DateTime.local({ zone: TIMEZONE });
  const [selectedRange, setSelectedRange] = useState<LessonRange>({ start: 1, end: 11 });
  const [selectedDate, setSelectedDate] = useState(today);
  const [pickerSelectedDate, setPickerSelectedDate] = useState(selectedDate);
  const [isDateTimePickerVisible, setIsDateTimePickerVisible] = useState(false);

  useEffect(() => {}, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: '空教室',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => <DateNavigator date={selectedDate} onPress={() => setIsDateTimePickerVisible(true)} />,
        }}
      />
      <PageContainer>
        <FloatModal
          visible={isDateTimePickerVisible}
          transparent
          title="选择日期"
          onClose={() => {
            setIsDateTimePickerVisible(false);
          }}
          onConfirm={() => {
            setSelectedDate(pickerSelectedDate);
            setIsDateTimePickerVisible(false);
          }}
          contentContainerClassName="h-96"
        >
          <DateTimePicker
            mode="single"
            date={pickerSelectedDate.toJSDate()}
            timeZone={TIMEZONE}
            // react-native-ui-datepicker v3.0.3 后保证所有的返回类型都是 Date，但是对应的类型声明还没有更改
            onChange={({ date }) => setPickerSelectedDate(DateTime.fromJSDate(date as Date) as DateTime)}
            locale="zh-cn"
            classNames={getDefaultClassNames()}
            minDate={today.toJSDate()} // Set the minimum selectable date to today
          />
        </FloatModal>
        <Text>Test</Text>
      </PageContainer>
    </>
  );
}
