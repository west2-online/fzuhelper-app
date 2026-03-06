import dayjs from 'dayjs';
import { memo, useEffect, useMemo, useState } from 'react';
import { View, type LayoutRectangle } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import DayItem from '@/components/course/day-item';
import HeaderContainer from '@/components/course/header-container';
import TimeCol from '@/components/course/time-col';
import FreeFriendsCol from '@/components/free-friends/free-friends-col';
import { Text } from '@/components/ui/text';
import { DATE_FORMAT_FULL } from '@/lib/constants';
import { LEFT_TIME_COLUMN_WIDTH, TOP_CALENDAR_HEIGHT } from '@/lib/course';
const DAYS = ['一', '二', '三', '四', '五', '六', '日'] as const;
interface FreeFriendsWeekProps {
  week: number;
  startDate: string;
  // freeMatrix[day][period-1] = number of free friends
  freeMatrix: number[][];
  totalFriends: number;
  flatListLayout: LayoutRectangle;
  onSlotPress?: (day: number, period: number) => void;
}

const FreeFriendsWeek = memo<FreeFriendsWeekProps>(
  ({ week, startDate, freeMatrix, totalFriends, flatListLayout, onSlotPress }) => {
    const month = useMemo(() => dayjs(startDate).month() + 1, [startDate]);
    const [currentDate, setCurrentDate] = useState(dayjs().format(DATE_FORMAT_FULL));

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentDate(dayjs().format(DATE_FORMAT_FULL));
      }, 60_000);
      return () => clearInterval(interval);
    }, []);

    const headerDays = useMemo(
      () =>
        Array.from({ length: 7 }, (_, i) => {
          const d = dayjs(startDate).add(i, 'day');
          return {
            key: d.toISOString(),
            day: DAYS[i],
            date: d.date(),
            isToday: d.isSame(currentDate, 'day'),
            isWeekend: i >= 5,
          };
        }),
      [startDate, currentDate],
    );

    const colLayout = useMemo(
      () => ({
        ...flatListLayout,
        width: flatListLayout.width - LEFT_TIME_COLUMN_WIDTH,
        height: flatListLayout.height - TOP_CALENDAR_HEIGHT,
      }),
      [flatListLayout],
    );

    return (
      <View className="flex flex-col" style={{ width: flatListLayout.width }}>
        <HeaderContainer style={{ width: flatListLayout.width, height: TOP_CALENDAR_HEIGHT }}>
          {/* Month label */}
          <View className="flex-shrink-0 flex-grow-0" style={{ width: LEFT_TIME_COLUMN_WIDTH }}>
            <View className="flex flex-shrink-0 flex-col items-center justify-center px-2 py-3">
              <Text>{month}</Text>
              <Text>月</Text>
            </View>
          </View>
          {/* Day headers */}
          <View className="mt-2 flex flex-row" style={{ width: flatListLayout.width - LEFT_TIME_COLUMN_WIDTH }}>
            {headerDays.map(item => (
              <DayItem
                key={item.key}
                day={item.day}
                date={item.date}
                variant={item.isToday ? 'highlight' : item.isWeekend ? 'muted' : 'default'}
              />
            ))}
          </View>
        </HeaderContainer>

        {flatListLayout.height > 0 && (
          <ScrollView
            className="flex-1"
            contentContainerClassName="flex flex-row"
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            bounces={false}
          >
            <TimeCol height={flatListLayout.height - TOP_CALENDAR_HEIGHT} />
            <View className="flex flex-1 flex-row">
              {Array.from({ length: 7 }, (_, day) => (
                <FreeFriendsCol
                  key={`${week}_${day}`}
                  freeCountPerSlot={freeMatrix[day] ?? new Array(11).fill(0)}
                  totalFriends={totalFriends}
                  flatListLayout={colLayout}
                  onSlotPress={period => onSlotPress?.(day, period)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    );
  },
);

FreeFriendsWeek.displayName = 'FreeFriendsWeek';

export default FreeFriendsWeek;
