import { useQueries } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { JwchCourseListResponse_Course } from '@/api/backend';
import { getApiV1FriendCourse, getApiV1UserFriendList } from '@/api/generate';
import { CourseErrorBoundary } from '@/components/course/course-error-boundary';
import FreeFriendsGrid, { type FreeFriendsGridRef } from '@/components/free-friends/free-friends-grid';
import ParticipantSelectorModal from '@/components/free-friends/participant-selector-modal';
import SlotDetailModal, { type ParticipantStatus, type SlotInfo } from '@/components/free-friends/slot-detail-modal';
import { Icon } from '@/components/Icon';
import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import PickerModal from '@/components/picker-modal';
import { Text } from '@/components/ui/text';
import { CoursePageProvider } from '@/context/course-page';
import useApiRequest from '@/hooks/useApiRequest';
import { useCoursePageData } from '@/hooks/useCourseDataSuspense';
import { EXPIRE_ONE_DAY, FRIEND_LIST_KEY } from '@/lib/constants';
import { COURSE_TYPE, CourseCache, type ExtendCourse } from '@/lib/course';

function FreeFriendsContent() {
  const router = useRouter();
  const coursePageData = useCoursePageData();
  const { currentWeek, maxWeek, currentTerm } = coursePageData;
  const selectedSemester = coursePageData.setting.selectedSemester;
  const ownSchedulesByDays = coursePageData.schedulesByDays;

  const [selectedWeek, setSelectedWeek] = useState(currentWeek === -1 ? 1 : Math.min(currentWeek, maxWeek));
  const [showWeekSelector, setShowWeekSelector] = useState(false);
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [showParticipantSelector, setShowParticipantSelector] = useState(false);
  // 'self' represents the user, friend stu_id represents friends
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set(['self']));

  const gridRef = useRef<FreeFriendsGridRef>(null);

  // Fetch friend list
  const { data: friendList } = useApiRequest(
    getApiV1UserFriendList,
    {},
    { persist: true, queryKey: [FRIEND_LIST_KEY] },
  );

  const totalFriends = friendList?.length ?? 0;

  // Initialize: select all participants by default
  useEffect(() => {
    if (friendList && friendList.length > 0) {
      setSelectedParticipantIds(prev => {
        const next = new Set(prev);
        next.add('self');
        friendList.forEach(f => next.add(f.stu_id));
        return next;
      });
    }
  }, [friendList]);

  // Total participants = selected participants count
  const totalParticipants = selectedParticipantIds.size;

  // Fetch all friends' courses in parallel
  const friendCourseQueries = useQueries({
    queries: (friendList ?? []).map(friend => ({
      queryKey: ['free_friends_course', friend.stu_id, selectedSemester] as const,
      queryFn: async () => {
        const res = await getApiV1FriendCourse({ student_id: friend.stu_id, term: selectedSemester });
        const courses = res.data.data;
        if (!Array.isArray(courses)) return {} as Record<number, ExtendCourse[]>;
        return CourseCache.processFriendCourses(courses as JwchCourseListResponse_Course[]);
      },
      staleTime: EXPIRE_ONE_DAY,
    })),
  });

  const allLoaded = friendCourseQueries.length > 0 && friendCourseQueries.every(q => q.isSuccess || q.isError);

  // Helper: collect all busy (week, day, period) slots for a set of schedulesByDays
  const collectBusySlots = useCallback(
    (schedulesByDay: Record<number, ExtendCourse[]>): string[] => {
      const seen: Record<string, boolean> = {};
      const result: string[] = [];
      for (let day = 0; day < 7; day++) {
        const courses = schedulesByDay[day];
        if (!courses || !Array.isArray(courses)) continue;
        for (let ci = 0; ci < courses.length; ci++) {
          const course = courses[ci];
          if (course.type !== COURSE_TYPE) continue;
          const wStart = course.startWeek;
          const wEnd = Math.min(course.endWeek, maxWeek);
          for (let week = wStart; week <= wEnd; week++) {
            if (!((course.single && week % 2 === 1) || (course.double && week % 2 === 0))) continue;
            for (let p = course.startClass; p <= course.endClass; p++) {
              const key = `${week},${day},${p}`;
              if (!seen[key]) {
                seen[key] = true;
                result.push(key);
              }
            }
          }
        }
      }
      return result;
    },
    [maxWeek],
  );

  // Build the free-count matrix for all weeks
  // allFreeMatrix[week-1][day][period-1] = number of participants who are free
  const allFreeMatrix = useMemo<number[][][]>(() => {
    // Initialise: all selected participants are free
    const matrix: number[][][] = Array.from({ length: maxWeek }, () =>
      Array.from({ length: 7 }, () => new Array(11).fill(totalParticipants)),
    );

    // Subtract the user's own busy slots if selected
    if (selectedParticipantIds.has('self')) {
      const ownBusy = collectBusySlots(ownSchedulesByDays as Record<number, ExtendCourse[]>);
      for (let i = 0; i < ownBusy.length; i++) {
        const parts = ownBusy[i].split(',').map(Number);
        matrix[parts[0] - 1][parts[1]][parts[2] - 1] = Math.max(0, matrix[parts[0] - 1][parts[1]][parts[2] - 1] - 1);
      }
    }

    if (!allLoaded || totalFriends === 0) return matrix;

    // Subtract each selected friend's busy slots
    friendCourseQueries.forEach((query, index) => {
      if (!query.data) return;
      const friend = friendList?.[index];
      if (!friend || !selectedParticipantIds.has(friend.stu_id)) return;
      const busySlots = collectBusySlots(query.data as Record<number, ExtendCourse[]>);
      for (let i = 0; i < busySlots.length; i++) {
        const parts = busySlots[i].split(',').map(Number);
        matrix[parts[0] - 1][parts[1]][parts[2] - 1] = Math.max(0, matrix[parts[0] - 1][parts[1]][parts[2] - 1] - 1);
      }
    });

    return matrix;
  }, [
    collectBusySlots,
    ownSchedulesByDays,
    allLoaded,
    friendCourseQueries,
    totalParticipants,
    totalFriends,
    maxWeek,
    selectedParticipantIds,
    friendList,
  ]);

  // Check if a specific slot is busy for a given schedulesByDays
  const isSlotBusy = useCallback(
    (schedulesByDay: Record<number, ExtendCourse[]>, week: number, day: number, period: number): boolean => {
      const courses = schedulesByDay[day];
      if (!courses || !Array.isArray(courses)) return false;
      for (const course of courses) {
        if (course.type !== COURSE_TYPE) continue;
        if (week < course.startWeek || week > Math.min(course.endWeek, maxWeek)) continue;
        if (!((course.single && week % 2 === 1) || (course.double && week % 2 === 0))) continue;
        if (period >= course.startClass && period <= course.endClass) return true;
      }
      return false;
    },
    [maxWeek],
  );

  // Get status of all participants for a specific slot
  const getParticipantsStatus = useCallback(
    (week: number, day: number, period: number): ParticipantStatus[] => {
      const participants: ParticipantStatus[] = [];

      // Add self first if selected
      if (selectedParticipantIds.has('self')) {
        const isOwnBusy = isSlotBusy(ownSchedulesByDays as Record<number, ExtendCourse[]>, week, day, period);
        participants.push({ name: '我', college: '', major: '', isBusy: isOwnBusy });
      }

      // Add selected friends
      friendList?.forEach((friend, index) => {
        if (!selectedParticipantIds.has(friend.stu_id)) return;
        const query = friendCourseQueries[index];
        const isBusy = query?.data
          ? isSlotBusy(query.data as Record<number, ExtendCourse[]>, week, day, period)
          : false;
        participants.push({
          name: friend.name,
          college: friend.college,
          major: friend.major,
          isBusy,
        });
      });

      return participants;
    },
    [friendCourseQueries, friendList, isSlotBusy, ownSchedulesByDays, selectedParticipantIds],
  );

  const handleSlotPress = useCallback((week: number, day: number, period: number) => {
    setSlotInfo({ week, day, period });
  }, []);

  const participantsStatus = useMemo(() => {
    if (!slotInfo) return null;
    return getParticipantsStatus(slotInfo.week, slotInfo.day, slotInfo.period);
  }, [slotInfo, getParticipantsStatus]);

  const weekPickerData = useMemo(
    () => Array.from({ length: maxWeek }, (_, i) => ({ value: String(i + 1), label: `第 ${i + 1} 周` })),
    [maxWeek],
  );

  const headerTitle = useCallback(
    () => (
      <Pressable onPress={() => setShowWeekSelector(v => !v)} className="flex flex-row items-center">
        <Text className="mr-1 text-lg">
          第 {selectedWeek} 周{selectedWeek === currentWeek ? ' (本周)' : ''}
        </Text>
        <Icon name={showWeekSelector ? 'caret-up-outline' : 'caret-down-outline'} size={10} />
      </Pressable>
    ),
    [selectedWeek, currentWeek, showWeekSelector],
  );

  const headerRight = useCallback(
    () => (
      <Pressable className="mr-4 flex flex-row items-center gap-1" onPress={() => setShowParticipantSelector(true)}>
        <Icon name="people-outline" size={20} />
        <Text className="text-xs text-primary">
          {selectedParticipantIds.size}/{totalFriends + 1}
        </Text>
      </Pressable>
    ),
    [selectedParticipantIds.size, totalFriends],
  );

  const toggleParticipant = useCallback((id: string) => {
    setSelectedParticipantIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllParticipants = useCallback(() => {
    const all = new Set(['self']);
    friendList?.forEach(f => all.add(f.stu_id));
    setSelectedParticipantIds(all);
  }, [friendList]);

  const deselectAllParticipants = useCallback(() => {
    setSelectedParticipantIds(new Set());
  }, []);

  return (
    <CoursePageProvider value={{ setting: coursePageData.setting }}>
      <Stack.Screen
        options={{
          title: '没课约',
          headerTitle,
          headerRight,
        }}
      />

      {/* No friends: prompt to add */}
      {totalFriends === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-2 text-center text-lg font-medium">还没有好友</Text>
          <Text className="text-center text-text-secondary">前往好友管理添加好友后，这里会显示大家都有空的时间段</Text>
          <Pressable
            className="mt-6 rounded-lg bg-primary px-6 py-3"
            onPress={() => router.push('/settings/friend/list')}
          >
            <Text className="font-medium text-white">去添加好友</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Loading indicator while fetching friend courses */}
          {!allLoaded && (
            <View className="absolute inset-x-0 top-0 z-10 items-center py-1">
              <Text className="text-xs text-text-secondary">正在加载好友课表…</Text>
            </View>
          )}

          <FreeFriendsGrid
            ref={gridRef}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            allFreeMatrix={allFreeMatrix}
            totalFriends={totalParticipants}
            maxWeek={maxWeek}
            currentTerm={currentTerm}
            onSlotPress={handleSlotPress}
          />

          <PickerModal
            visible={showWeekSelector}
            title="选择周数"
            data={weekPickerData}
            value={String(selectedWeek)}
            onClose={() => setShowWeekSelector(false)}
            onConfirm={val => {
              setShowWeekSelector(false);
              gridRef.current?.scrollToWeek(parseInt(val, 10));
            }}
          />

          <SlotDetailModal slotInfo={slotInfo} participants={participantsStatus} onClose={() => setSlotInfo(null)} />

          <ParticipantSelectorModal
            visible={showParticipantSelector}
            friendList={friendList}
            selectedIds={selectedParticipantIds}
            onToggle={toggleParticipant}
            onSelectAll={selectAllParticipants}
            onDeselectAll={deselectAllParticipants}
            onClose={() => setShowParticipantSelector(false)}
          />
        </>
      )}
    </CoursePageProvider>
  );
}

export default function FreeFriendsPage() {
  return (
    <PageContainer>
      <CourseErrorBoundary>
        <Suspense fallback={<Loading />}>
          <FreeFriendsContent />
        </Suspense>
      </CourseErrorBoundary>
    </PageContainer>
  );
}
