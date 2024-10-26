import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { getCourseListRes } from '@/mockdata';
import { parseCourses, type ParsedCourse } from '@/utils/parseCourses';

const classes = [
  ['08:20', '09:05'],
  ['09:15', '10:00'],
  ['10:20', '11:05'],
  ['11:15', '12:00'],
  ['14:00', '14:45'],
  ['14:55', '15:40'],
  ['15:50', '16:35'],
  ['16:45', '17:30'],
  ['19:00', '19:45'],
  ['19:55', '20:40'],
  ['20:50', '21:35'],
];

function Header() {
  return (
    <View className="flex flex-none flex-row items-center bg-white shadow ring-1 ring-black ring-opacity-5">
      <View className="w-[32px] flex-shrink-0 flex-grow-0">
        <View className="flex flex-shrink-0 flex-col items-center justify-center px-2 py-3">
          <Text>10</Text>
          <Text>月</Text>
        </View>
      </View>
      <View className="flex flex-shrink flex-grow flex-row">
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周一</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-center align-middle font-semibold text-white">
            10
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周二</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            11
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周三</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            12
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周四</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            13
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周五</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            14
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周六</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            15
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-gray-500">周日</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle font-semibold text-gray-900">
            16
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

interface CalendarColProps {
  week: number;
  weekday: number;
  schedules: ParsedCourse[];
}

function CalendarCol({ week, weekday, schedules }: CalendarColProps) {
  const [height, setHeight] = useState<number>(49 * 11);

  const schedulesOnDay = schedules.filter(
    schedule => schedule.weekday === weekday,
  );
  const res: React.ReactNode[] = [];

  for (let i = 1; i <= 11; i++) {
    const schedule = schedulesOnDay.find(
      s => s.startClass === i && s.startWeek <= week && s.endWeek >= week,
    );

    if (schedule) {
      const span = schedule.endClass - schedule.startClass + 1;

      res.push(
        <Pressable
          key={i}
          className="flex min-h-14 flex-shrink-0 flex-grow-0 basis-0 flex-col items-center justify-center border border-gray-200"
          style={{
            flexGrow: span,
            height: (span / 11) * height,
          }}
        >
          <Text className="truncate text-wrap break-all text-center text-[10px] text-gray-500">
            {schedule.name}
          </Text>
          <Text className="text-wrap break-all text-[8px] text-gray-500">
            {schedule.location}
          </Text>
        </Pressable>,
      );

      i += span - 1;
    } else {
      res.push(
        <View
          key={i}
          className="flex-grow-1 flex min-h-14 flex-shrink-0 basis-0 flex-col items-center justify-center border border-gray-200"
        />,
      );
    }
  }

  return (
    <View
      className="flex w-[14.285714%] flex-shrink-0 flex-grow flex-col"
      onLayout={({ nativeEvent }) => {
        setHeight(nativeEvent.layout.height);
      }}
    >
      {res}
    </View>
  );
}

export default function HomePage() {
  const schedules = parseCourses(getCourseListRes.data);

  return (
    <ScrollView
      className="flex h-full flex-auto flex-col overflow-auto bg-white"
      stickyHeaderIndices={[0]}
      overScrollMode="never"
      bounces={false}
    >
      <Header />
      <View className="flex flex-none flex-grow flex-row py-1">
        <View className="flex w-[32px] flex-shrink-0 flex-grow-0 basis-[32px] flex-col">
          {classes.map((time, index) => (
            <View
              key={index}
              className="flex min-h-14 w-[32px] flex-grow flex-col items-center py-1"
            >
              <Text className="text-[12px] font-bold text-gray-500">
                {index + 1}
              </Text>
              <Text className="text-[8px] text-gray-500">{time[0]}</Text>
              <Text className="text-[8px] text-gray-500">{time[1]}</Text>
            </View>
          ))}
        </View>
        <View className="flex flex-shrink flex-grow flex-row">
          {Array.from({ length: 7 }).map((_, index) => (
            <CalendarCol
              key={index}
              week={10}
              weekday={index + 1}
              schedules={schedules}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
