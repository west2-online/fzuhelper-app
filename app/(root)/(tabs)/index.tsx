import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { getApiV1JwchCourseList } from '@/api/generate';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { CLASS_SCHEDULES } from '@/lib/constants';
import { parseCourses, type ParsedCourse } from '@/utils/parseCourses';

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
  const schedulesOnDay = schedules.filter(schedule => schedule.weekday === weekday);
  const res: React.ReactNode[] = [];

  for (let i = 1; i <= 11; i++) {
    const schedule = schedulesOnDay.find(s => s.startClass === i && s.startWeek <= week && s.endWeek >= week);

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
          <Text className="truncate text-wrap break-all text-center text-[10px] text-gray-500">{schedule.name}</Text>
          <Text className="text-wrap break-all text-[8px] text-gray-500">{schedule.location}</Text>
        </Pressable>,
      );

      i += span - 1;
    } else {
      res.push(
        <View
          key={i}
          className="flex-grow-1 flex min-h-14 flex-shrink-0 basis-0 flex-col items-center justify-center"
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
  const term = '202401';
  const week = 10;
  const { data, isLoading } = usePersistedQuery({
    queryKey: ['getApiV1JwchCourseList', term],
    queryFn: () => getApiV1JwchCourseList({ term }),
  });

  if (!data) return null;

  const schedules = parseCourses(data.data.data);

  return (
    <>
      <Tabs.Screen
        options={{
          headerTitleAlign: 'center',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerLeft: () => <Text>第 {week} 周</Text>,
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => <Text>Settings</Text>,
        }}
      />

      <ScrollView
        className="flex h-full flex-auto flex-col overflow-auto bg-white"
        stickyHeaderIndices={[0]}
        overScrollMode="never"
        bounces={false}
      >
        <Header />
        <View className="flex flex-none flex-grow flex-row py-1">
          <View className="flex w-[32px] flex-shrink-0 flex-grow-0 basis-[32px] flex-col">
            {CLASS_SCHEDULES.map((time, index) => (
              <View key={index} className="flex min-h-14 w-[32px] flex-grow flex-col items-center py-1">
                <Text className="text-[12px] font-bold text-gray-500">{index + 1}</Text>
                <Text className="text-[8px] text-gray-500">{time[0]}</Text>
                <Text className="text-[8px] text-gray-500">{time[1]}</Text>
              </View>
            ))}
          </View>
          <View className="flex flex-shrink flex-grow flex-row">
            {Array.from({ length: 7 }).map((_, index) => (
              <CalendarCol key={index} week={week} weekday={index + 1} schedules={schedules} />
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
