import { useQueries } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { JwchCourseListResponse_Course } from '@/api/backend';
import { RejectEnum } from '@/api/enum';
import { getApiV1FriendCourse, getApiV1UserFriendList } from '@/api/generate';
import { CourseErrorBoundary } from '@/components/course/course-error-boundary';
import FreeFriendsGrid, { type FreeFriendsGridRef } from '@/components/free-friends/free-friends-grid';
import ParticipantSelectorModal from '@/components/free-friends/participant-selector-modal';
import SlotDetailModal, { type ParticipantStatus, type SlotInfo } from '@/components/free-friends/slot-detail-modal';
import { Icon } from '@/components/Icon';
import Loading from '@/components/loading';
import MultiStateView, { STATE } from '@/components/multistateview/multi-state-view';
import PageContainer from '@/components/page-container';
import PickerModal from '@/components/picker-modal';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { CoursePageProvider } from '@/context/course-page';
import useApiRequest from '@/hooks/useApiRequest';
import { useCoursePageData } from '@/hooks/useCourseDataSuspense';
import { EXPIRE_ONE_DAY, FRIEND_LIST_KEY } from '@/lib/constants';
import { COURSE_TYPE, CourseCache, type ExtendCourse } from '@/lib/course';
import { BorderlessButton } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  // 'self' 表示用户本人，好友则使用各自的 stu_id 表示
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set(['self']));

  const gridRef = useRef<FreeFriendsGridRef>(null);

  // 获取好友列表
  const {
    data: friendList,
    isFetching: isFriendListFetching,
    isError: isFriendListError,
    error: friendListError,
    refetch: refetchFriendList,
  } = useApiRequest(getApiV1UserFriendList, {}, { persist: true, queryKey: [FRIEND_LIST_KEY] });

  const totalFriends = friendList?.length ?? 0;

  // 初始化：默认选中所有参与者
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

  // 参与者总数
  const totalParticipants = selectedParticipantIds.size;

  // 并行获取所有好友的课程
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

  const allLoaded = friendCourseQueries.every(q => q.isSuccess || q.isError);
  const isFriendCoursesLoading = totalFriends > 0 && !allLoaded;

  const state = useMemo(() => {
    if (isFriendListFetching || isFriendCoursesLoading) return STATE.LOADING;
    if (isFriendListError) {
      return friendListError?.type === RejectEnum.NetworkError ? STATE.NO_NETWORK : STATE.ERROR;
    }
    return STATE.CONTENT;
  }, [friendListError?.type, isFriendCoursesLoading, isFriendListError, isFriendListFetching]);

  // 辅助方法：从 schedulesByDay 中收集所有忙碌时段（周、天、节次）
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

  // 构建所有周次的空闲人数矩阵
  // 矩阵[周序号-1][星期][节次-1] = 当前时段空闲的参与者数量
  const allFreeMatrix = useMemo<number[][][]>(() => {
    // 初始化：默认所有选中的参与者都空闲
    const matrix: number[][][] = Array.from({ length: maxWeek }, () =>
      Array.from({ length: 7 }, () => new Array(11).fill(totalParticipants)),
    );

    // 若已选中本人，则扣除本人忙碌时段
    if (selectedParticipantIds.has('self')) {
      const ownBusy = collectBusySlots(ownSchedulesByDays as Record<number, ExtendCourse[]>);
      for (let i = 0; i < ownBusy.length; i++) {
        const parts = ownBusy[i].split(',').map(Number);
        matrix[parts[0] - 1][parts[1]][parts[2] - 1] = Math.max(0, matrix[parts[0] - 1][parts[1]][parts[2] - 1] - 1);
      }
    }

    if (!allLoaded || totalFriends === 0) return matrix;

    // 逐个扣除已选中好友的忙碌时段
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

  // 判断在给定 schedulesByDay 下，某个时段是否忙碌
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

  // 获取某个时段下所有参与者的状态
  const getParticipantsStatus = useCallback(
    (week: number, day: number, period: number): ParticipantStatus[] => {
      const participants: ParticipantStatus[] = [];

      // 若已选中本人，优先加入本人状态
      if (selectedParticipantIds.has('self')) {
        const isOwnBusy = isSlotBusy(ownSchedulesByDays as Record<number, ExtendCourse[]>, week, day, period);
        participants.push({ name: '我', college: '', major: '', isBusy: isOwnBusy });
      }

      // 添加已选中的好友状态
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
      <BorderlessButton onPress={() => setShowParticipantSelector(true)}>
        <View className="flex-row items-center gap-1 py-4">
          <Icon name="people-outline" size={20} />
          <Text className="pl-1">
            {selectedParticipantIds.size}/{totalFriends + 1}
          </Text>
        </View>
      </BorderlessButton>
    ),
    [selectedParticipantIds.size, totalFriends],
  );

  const confirmParticipantSelection = useCallback((ids: Set<string>) => {
    setSelectedParticipantIds(new Set(ids));
  }, []);

  const handleRefresh = useCallback(() => {
    refetchFriendList();
    friendCourseQueries.forEach(query => {
      query.refetch();
    });
  }, [friendCourseQueries, refetchFriendList]);

  const { bottom } = useSafeAreaInsets();

  const msvContent = useMemo(() => {
    return (
      <>
        {totalFriends === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="mb-2 text-center text-lg font-medium">还没有好友</Text>
            <Text className="text-center text-text-secondary">
              前往好友管理添加好友后，这里会显示大家都有空的时间段
            </Text>
            <Button className="mt-10 w-1/2" onPress={() => router.push('/settings/friend/list')}>
              <Text className="font-medium text-white">去添加好友</Text>
            </Button>
          </View>
        ) : (
          <FreeFriendsGrid
            ref={gridRef}
            style={{ marginBottom: bottom }}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            allFreeMatrix={allFreeMatrix}
            totalFriends={totalParticipants}
            maxWeek={maxWeek}
            currentTerm={currentTerm}
            onSlotPress={handleSlotPress}
          />
        )}
        {/* 周数选择器 */}
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
        {/* 详情弹窗 */}
        <SlotDetailModal slotInfo={slotInfo} participants={participantsStatus} onClose={() => setSlotInfo(null)} />
        {/* 参与者选择 */}
        <ParticipantSelectorModal
          visible={showParticipantSelector}
          friendList={friendList}
          selectedIds={selectedParticipantIds}
          onConfirm={confirmParticipantSelection}
          onClose={() => setShowParticipantSelector(false)}
        />
      </>
    );
  }, [
    allFreeMatrix,
    bottom,
    confirmParticipantSelection,
    currentTerm,
    friendList,
    handleSlotPress,
    maxWeek,
    participantsStatus,
    router,
    selectedParticipantIds,
    selectedWeek,
    showParticipantSelector,
    showWeekSelector,
    slotInfo,
    totalFriends,
    totalParticipants,
    weekPickerData,
  ]);

  return (
    <CoursePageProvider value={{ setting: coursePageData.setting }}>
      <Stack.Screen
        options={{
          title: '约好友',
          headerTitle,
          headerRight,
        }}
      />

      <MultiStateView state={state} className="flex-1" content={msvContent} refresh={handleRefresh} />
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
