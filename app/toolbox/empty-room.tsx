import { getApiV1CommonClassroomEmpty } from '@/api/generate';
import { Icon } from '@/components/Icon';
import ClassroomList from '@/components/classroom-list';
import FAQModal from '@/components/faq-modal';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import PickerModal from '@/components/picker-modal';
import FloatModal from '@/components/ui/float-modal';
import { Text } from '@/components/ui/text';
import useApiRequest from '@/hooks/useApiRequest';
import { FAQ_EMPTY_ROOM } from '@/lib/FAQ';
import { type IntRange } from '@/types/int-range';
import dayjs from 'dayjs';
import { Stack } from 'expo-router';
import { CalendarDaysIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, TouchableOpacity, View, useColorScheme } from 'react-native';
import DateTimePicker, { useDefaultClassNames } from 'react-native-ui-datepicker';

type Campus = '旗山校区' | '铜盘校区' | '晋江校区' | '泉港校区' | '怡山校区' | '集美校区' | '鼓浪屿校区';
const CAMPUS_LIST: Campus[] = ['旗山校区', '铜盘校区', '晋江校区', '泉港校区', '怡山校区', '集美校区', '鼓浪屿校区'];
const TIMEZONE = 'Asia/Shanghai';
const DATE_FMT = 'YYYY-MM-DD';

interface LessonRange {
  start: IntRange<1, 12>;
  end: IntRange<1, 12>;
}

interface DateNavigatorProps {
  date: string;
  onPress: () => void;
}

function DateNavigator({ date, onPress }: DateNavigatorProps) {
  const currentColorScheme = useColorScheme();
  const iconColor = useMemo(() => (currentColorScheme === 'dark' ? 'white' : 'black'), [currentColorScheme]);

  return (
    <TouchableOpacity className="flex-row items-center" onPressIn={onPress}>
      <Text className="pr-2 text-lg">{date}</Text>
      <CalendarDaysIcon size={20} color={iconColor} />
    </TouchableOpacity>
  );
}

function generateStartPickerData(end: number): { value: IntRange<1, 12>; label: string }[] {
  return Array.from({ length: end }, (_, index) => ({
    value: (index + 1) as IntRange<1, 12>,
    label: `第 ${index + 1} 节`,
  }));
}

function generateEndPickerData(start: number): { value: IntRange<1, 12>; label: string }[] {
  return Array.from({ length: 11 - start + 1 }, (_, index) => ({
    value: (start + index) as IntRange<1, 12>,
    label: `第 ${start + index} 节`,
  }));
}

export default function EmptyRoomPage() {
  const today = useMemo(() => dayjs(), []);
  const defaultClassNames = useDefaultClassNames();

  const [selectedRange, setSelectedRange] = useState<LessonRange>({ start: 1, end: 11 });
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedCampus, setSelectedCampus] = useState<Campus>('旗山校区');
  const [showFAQ, setShowFAQ] = useState(false);

  const [pickerSelectedDate, setPickerSelectedDate] = useState(selectedDate);
  const [isDateTimePickerVisible, setIsDateTimePickerVisible] = useState(false);

  const [isRangeStartPickerVisible, setIsRangeStartPickerVisible] = useState(false);
  const [isRangeEndPickerVisible, setIsRangeEndPickerVisible] = useState(false);
  const [isCampusPickerVisible, setCampusPickerVisible] = useState(false);
  const campusData = CAMPUS_LIST.map(campus => ({ value: campus, label: campus }));

  const { data: roomData, status: loadingState } = useApiRequest(getApiV1CommonClassroomEmpty, {
    date: selectedDate.format(DATE_FMT),
    campus: selectedCampus,
    startTime: selectedRange.start.toString(),
    endTime: selectedRange.end.toString(),
  });

  // 处理 Modal 显示事件
  const handleModalVisible = useCallback(() => {
    setShowFAQ(prev => !prev);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: '空教室',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <DateNavigator date={selectedDate.format(DATE_FMT)} onPress={() => setIsDateTimePickerVisible(true)} />
          ),
        }}
      />
      <PageContainer>
        {/* 选择器区域 */}
        <View className="w-full flex-row items-center justify-between px-4 py-2">
          {/* 左侧按钮 */}
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center px-2 py-2"
            onPressIn={() => setIsRangeStartPickerVisible(true)}
          >
            <Text className="pr-1">第 {selectedRange.start} 节</Text>
            <Icon name={isRangeStartPickerVisible ? 'caret-up-outline' : 'caret-down-outline'} size={10} />
          </TouchableOpacity>
          {/* 中间的“至” */}
          <Text className="mx-3">至</Text>
          {/* 右侧按钮 */}
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center px-2 py-2"
            onPressIn={() => setIsRangeEndPickerVisible(true)}
          >
            <Text className="pr-1">第 {selectedRange.end} 节</Text>
            <Icon name={isRangeEndPickerVisible ? 'caret-up-outline' : 'caret-down-outline'} size={10} />
          </TouchableOpacity>
          {/* 校区按钮 */}
          <TouchableOpacity
            className="ml-3 flex-1 flex-row items-center justify-center px-2 py-2"
            onPressIn={() => setCampusPickerVisible(true)}
          >
            <Text className="pr-1">{selectedCampus}</Text>
            <Icon name={isCampusPickerVisible ? 'caret-up-outline' : 'caret-down-outline'} size={10} />
          </TouchableOpacity>
          <Pressable onPress={handleModalVisible} className="flex-right flex-row items-center">
            <Icon name="help-circle-outline" size={26} className="mr-4" />
          </Pressable>
        </View>
        {loadingState === 'success' ? (
          <ClassroomList data={roomData} />
        ) : loadingState === 'pending' ? (
          <Loading className="flex-1" />
        ) : (
          <Text>获取空教室数据失败</Text> // FIXME: 替换为加载失败图片
        )}
        {/* 日期选择器 */}
        <FloatModal
          visible={isDateTimePickerVisible}
          transparent
          title="选择日期"
          onClose={() => {
            setIsDateTimePickerVisible(false);
            // 在取消时重置 datetime picker 的日期，避免再次打开时显示上一次的日期
            setPickerSelectedDate(selectedDate);
          }}
          onConfirm={() => {
            setSelectedDate(pickerSelectedDate);
            setIsDateTimePickerVisible(false);
          }}
          contentContainerClassName="h-96 items-center"
        >
          <DateTimePicker
            mode="single"
            date={pickerSelectedDate.toDate()}
            timeZone={TIMEZONE}
            onChange={({ date }) => setPickerSelectedDate(dayjs(date))}
            locale="zh-cn"
            classNames={defaultClassNames}
            // 选择范围为从今天开始的一周内
            minDate={today.toDate()}
            maxDate={today.add(6, 'day').toDate()}
          />
        </FloatModal>

        {/* 起始节数选择器 */}
        <PickerModal
          visible={isRangeStartPickerVisible}
          title="选择起始节数"
          onClose={() => setIsRangeStartPickerVisible(false)}
          value={selectedRange.start}
          data={generateStartPickerData(selectedRange.end)}
          onConfirm={value => {
            setSelectedRange(prev => ({ ...prev, start: value }));
            setIsRangeStartPickerVisible(false);
          }}
        />

        {/* 结束节数选择器 */}
        <PickerModal
          visible={isRangeEndPickerVisible}
          title="选择终止节数"
          onClose={() => setIsRangeEndPickerVisible(false)}
          value={selectedRange.end}
          data={generateEndPickerData(selectedRange.start)}
          onConfirm={value => {
            setSelectedRange(prev => ({ ...prev, end: value }));
            setIsRangeEndPickerVisible(false);
          }}
        />

        {/* 校区选择器 */}
        <PickerModal
          visible={isCampusPickerVisible}
          title="选择校区"
          onClose={() => setCampusPickerVisible(false)}
          value={selectedCampus}
          data={campusData}
          onConfirm={value => {
            setSelectedCampus(value);
            setCampusPickerVisible(false);
          }}
        />
        {/* FAQ Modal */}
        <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} data={FAQ_EMPTY_ROOM} />
      </PageContainer>
    </>
  );
}
