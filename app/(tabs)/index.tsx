import { useState } from 'react';
import { ScrollView, Text, View } from 'tamagui';

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
    <View
      display="flex"
      flexDirection="row"
      alignItems="center"
      backgroundColor="$white1"
      flexBasis={0}
      flexGrow={0}
      flexShrink={0}
    >
      <View width={32} flexShrink={0} flexGrow={0}>
        <View
          flexShrink={0}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          paddingHorizontal="$2"
          paddingVertical="$3"
        >
          <Text>10</Text>
          <Text>月</Text>
        </View>
      </View>
      <View display="flex" flexDirection="row" flexGrow={1} flexShrink={1}>
        {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(
          (day, index) => (
            <View
              key={index}
              display="flex"
              flexDirection="column"
              alignItems="center"
              paddingBottom="$3"
              paddingTop="$2"
              flexGrow={1}
              flexShrink={1}
            >
              <Text color="$gray500">{day}</Text>
              <View
                marginTop="$1"
                height={32}
                width={32}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius={16}
                backgroundColor={index === 0 ? '$blue9' : 'transparent'}
              >
                <Text
                  textAlign="center"
                  fontWeight="bold"
                  color={index === 0 ? '$white' : '$black'}
                >
                  {10 + index}
                </Text>
              </View>
            </View>
          ),
        )}
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
        <View
          key={i}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          borderWidth={1}
          borderColor="$black"
          flexShrink={0}
          flexGrow={span}
          height={(span * 11) / height}
          overflow="hidden"
        >
          <Text
            numberOfLines={2}
            textAlign="center"
            textWrap="wrap"
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              wordBreak: 'break-all',
            }}
          >
            {schedule.name}
          </Text>
          <Text textAlign="center">{schedule.location}</Text>
        </View>,
      );

      i += span - 1;
    } else {
      res.push(
        <View
          key={i}
          flexGrow={1}
          minHeight={49}
          flexShrink={0}
          flexBasis={0}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height={(1 / 11) * height}
        />,
      );
    }
  }

  return (
    <View
      width="14.285714%"
      flexShrink={0}
      flexGrow={1}
      flexDirection="column"
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
      flex={1}
      flexDirection="column"
      backgroundColor="$white"
      stickyHeaderIndices={[0]}
      overScrollMode="never"
      bounces={false}
    >
      <Header />
      <View flexDirection="row" paddingVertical="$1">
        <View width={32} flexShrink={0} flexGrow={0} flexDirection="column">
          {classes.map((time, index) => (
            <View
              key={index}
              minHeight={56}
              width={32}
              flexGrow={1}
              flexDirection="column"
              alignItems="center"
              paddingVertical="$1"
            >
              <Text fontWeight="bold" color="$gray500">
                {index + 1}
              </Text>
              <Text color="$gray500">{time[0]}</Text>
              <Text color="$gray500">{time[1]}</Text>
            </View>
          ))}
        </View>
        <View flexDirection="row" flexGrow={1} flexShrink={1}>
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
