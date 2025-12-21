import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, BackHandler, FlatList, Platform, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';

import { UserFriendListResponse, UserFriendListResponse_Friend } from '@/api/backend';
import { getApiV1UserFriendList, postApiV1UserFriendOpenApiDelete } from '@/api/generate';
import { Icon } from '@/components/Icon';
import MultiStateView from '@/components/multistateview/multi-state-view';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import useApiRequest from '@/hooks/useApiRequest';
import useMultiStateRequest from '@/hooks/useMultiStateRequest';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { FRIEND_LIST_KEY } from '@/lib/constants';
import dayjs from 'dayjs';
import { BorderlessButton } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FriendManagePage() {
  const { handleError } = useSafeResponseSolve();

  const apiResult = useApiRequest(getApiV1UserFriendList, {}, { persist: true, queryKey: [FRIEND_LIST_KEY] });
  const { data: friendList, refetch } = apiResult;

  const { state } = useMultiStateRequest(apiResult, {
    emptyCondition: data => !data || data.length === 0,
    onEmpty: () => setIsManage(false),
  });

  const [isManage, setIsManage] = useState(false);

  const handleDelete = useCallback(
    async (friend: UserFriendListResponse_Friend) => {
      const diff = dayjs().diff(dayjs(friend.created_at * 1000), 'day');
      const diffString = diff === 0 ? '今天' : `${diff}天前`;
      Alert.alert(
        '提示',
        `你与${friend.name}在${diffString}成为好友，解除好友关系后，你们将无法再互相查看课表。确定要删除好友吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '删除',
            style: 'destructive',
            onPress: async () => {
              try {
                await postApiV1UserFriendOpenApiDelete({ student_id: friend.stu_id });
                toast.success('删除成功');
                refetch();
              } catch (error: any) {
                const data = handleError(error) as { message: string };
                if (data) {
                  toast.error(data.message);
                }
              }
            },
          },
        ],
      );
    },
    [handleError, refetch],
  );

  const renderItem = useCallback(
    ({ item }: { item: UserFriendListResponse[0] }) => (
      <View className="flex-row items-center justify-between py-4">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-medium">{item.name}</Text>
          <Text className="text-sm text-text-secondary">
            {item.grade}级{item.college}
            {item.major}专业
          </Text>
        </View>
        {isManage && (
          <TouchableOpacity onPress={() => handleDelete(item)} className="p-2">
            <Icon name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    ),
    [handleDelete, isManage],
  );

  const headerRight = useCallback(() => {
    return (
      <BorderlessButton onPress={() => setIsManage(!isManage)}>
        <Text>{isManage ? '完成' : '管理'}</Text>
      </BorderlessButton>
    );
  }, [isManage]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // 返回键如果是manage态，则先退出manage态
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
          if (isManage) {
            setIsManage(false);
            return true;
          }

          return false;
        });

        return () => {
          subscription.remove();
        };
      }
    }, [isManage]),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '我的好友',
          headerRight,
        }}
      />

      <PageContainer>
        <MultiStateView
          state={state}
          refresh={refetch}
          className="flex-1"
          content={
            <FlatList
              data={friendList}
              renderItem={renderItem}
              keyExtractor={item => item.stu_id}
              contentContainerClassName="px-8"
            />
          }
        />
        <SafeAreaView edges={['bottom']} className="mb-2 flex-row gap-4 px-6">
          <Button variant="outline" className="flex-1" onPress={() => router.push('/settings/friend/invite')}>
            <Text>我的邀请码</Text>
          </Button>
          <Button className="flex-1" onPress={() => router.push('/settings/friend/add')}>
            <Text>添加好友</Text>
          </Button>
        </SafeAreaView>
      </PageContainer>
    </>
  );
}
