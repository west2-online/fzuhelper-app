import { Link, router, Tabs } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TouchableOpacity, View } from 'react-native';

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';

import { getApiV1JwchCourseList } from '@/api/generate';
import usePersistedQuery from '@/hooks/usePersistedQuery';
import { CLASS_SCHEDULES, JWCH_COOKIES_KEY, JWCH_ID_KEY } from '@/lib/constants';
import { parseCourses, type ParsedCourse } from '@/utils/parseCourses';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from 'sonner-native';

function Header() {
  return (
    <View className="flex flex-none flex-row items-center bg-white shadow ring-1 ring-black ring-opacity-5">
      <View className="w-[32px] flex-shrink-0 flex-grow-0">
        <View className="flex flex-shrink-0 flex-col items-center justify-center px-2 py-3">
          <Text>10</Text>
          <Text>月</Text>
        </View>
      </View>
      <View className="mt-2 flex flex-shrink flex-grow flex-row">
        {/* 选中（当天）样式 */}
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-primary">一</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle text-xl font-medium text-primary">
            10
          </Text>
          <View className="mt-1 h-1 w-9 rounded-sm bg-primary" />
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm">二</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle text-xl font-medium text-gray-900">
            11
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm">三</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle text-xl font-medium text-gray-900">
            12
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm">四</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle text-xl font-medium text-gray-900">
            13
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm">五</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle text-xl font-medium text-gray-900">
            14
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-muted-foreground">六</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle text-xl font-medium text-gray-900">
            15
          </Text>
        </Pressable>
        <Pressable className="flex flex-grow flex-col items-center pb-3 pt-2">
          <Text className="text-sm text-muted-foreground">日</Text>
          <Text className="mt-1 flex h-8 w-8 items-center justify-center text-center align-middle text-xl font-medium text-gray-900">
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
        <Dialog key={i}>
          <DialogTrigger asChild>
            <Pressable
              className="flex min-h-14 flex-shrink-0 flex-grow-0 basis-0 flex-col items-center justify-center rounded-lg border border-gray-200 p-[1px]"
              style={{
                flexGrow: span,
                height: (span / 11) * height,
              }}
            >
              <Text className="truncate text-wrap break-all text-center text-[11px] text-gray-500">
                {schedule.name}
              </Text>
              <Text className="text-wrap break-all text-[11px] text-gray-500">{schedule.location}</Text>
            </Pressable>
          </DialogTrigger>

          <DialogContent className="flex w-[90vw] flex-col justify-center py-10 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-center text-primary">{schedule.name}</DialogTitle>
            </DialogHeader>

            <DescriptionList className="mx-6 my-4">
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text>教室</Text>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Text>{schedule.location}</Text>
                </DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text>教师</Text>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Text>{schedule.teacher}</Text>
                </DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text>节数</Text>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Text>
                    {schedule.startClass}-{schedule.endClass} 节
                  </Text>
                </DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text>周数</Text>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Text>
                    {schedule.startWeek}-{schedule.endWeek} 周
                  </Text>
                </DescriptionListDescription>
              </DescriptionListRow>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text>备注</Text>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Text>{schedule.remark}</Text>
                </DescriptionListDescription>
              </DescriptionListRow>
            </DescriptionList>

            <View className="flex flex-row justify-evenly">
              <DialogClose asChild>
                <TouchableOpacity
                  onPress={async () =>
                    router.push({
                      pathname: '/(guest)/web',
                      params: {
                        url: `${schedule.syllabus}&id=${await AsyncStorage.getItem(JWCH_ID_KEY)}`,
                        jwchCookie: await AsyncStorage.getItem(JWCH_COOKIES_KEY),
                      },
                    })
                  }
                >
                  <Text className="text-primary">教学大纲</Text>
                </TouchableOpacity>
              </DialogClose>
              <DialogClose asChild>
                <TouchableOpacity
                  onPress={async () =>
                    router.push({
                      pathname: '/(guest)/web',
                      params: {
                        url: `${schedule.lessonplan}&id=${await AsyncStorage.getItem(JWCH_ID_KEY)}`,
                        jwchCookie: await AsyncStorage.getItem(JWCH_COOKIES_KEY),
                      },
                    })
                  }
                >
                  <Text className="text-primary">授课计划</Text>
                </TouchableOpacity>
              </DialogClose>
            </View>
          </DialogContent>
        </Dialog>,
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
  const term = '202402';
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
          headerLeft: () => <Text className="ml-4 text-2xl font-medium">课程表</Text>,
          // eslint-disable-next-line react/no-unstable-nested-components
          headerTitle: () => (
            <Pressable onPress={() => toast.info('周数切换')} className="flex flex-row items-center">
              <Text className="mr-1 text-lg">第 {week} 周 </Text>
              <AntDesign name="caretdown" size={10} color="black" />
            </Pressable>
          ),
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <Link href="/course/course-settings" asChild>
              <AntDesign name="setting" size={24} color="black" className="mr-4" />
            </Link>
          ),
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
