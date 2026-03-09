import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';

import { UserFriendListResponse, UserFriendListResponse_Friend } from '@/api/backend';
import {
  getApiV1UserFriendList,
  getApiV1UserFriendMaxNum,
  postApiV1UserFriendOpenApiDelete,
  postApiV1UserFriendReorder,
} from '@/api/generate';
import { Icon } from '@/components/Icon';
import MultiStateView from '@/components/multistateview/multi-state-view';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import useApiRequest from '@/hooks/useApiRequest';
import useMultiStateRequest from '@/hooks/useMultiStateRequest';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { FRIEND_LIST_KEY } from '@/lib/constants';
import { pushToWebViewNormal } from '@/lib/webview';
import dayjs from 'dayjs';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { BorderlessButton, RefreshControl } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FriendManagePage() {
  const { handleError } = useSafeResponseSolve();

  const apiResult = useApiRequest(getApiV1UserFriendList, {}, { persist: true, queryKey: [FRIEND_LIST_KEY] });
  const { data: friendList, refetch, isFetching } = apiResult;

  const { data: maxNumData } = useApiRequest(getApiV1UserFriendMaxNum, {});

  const { state } = useMultiStateRequest(apiResult, {
    emptyCondition: data => !data || data.length === 0,
    onEmpty: () => setIsManage(false),
  });

  const [isManage, setIsManage] = useState(false);
  const [orderedList, setOrderedList] = useState<UserFriendListResponse>(friendList ?? []);
  const orderChangedRef = useRef(false);

  // 从服务端拉取数据后同步到本地排序状态
  useEffect(() => {
    if (friendList) {
      setOrderedList(friendList);
    }
  }, [friendList]);

  const handleReorder = useCallback(
    async (data: UserFriendListResponse) => {
      orderChangedRef.current = false;
      try {
        await postApiV1UserFriendReorder({ friend_ids: data.map(item => item.stu_id) });
      } catch (error: any) {
        const errData = handleError(error) as { message: string };
        if (errData) {
          toast.error(errData.message);
        }
        refetch();
      }
    },
    [handleError, refetch],
  );

  const handleDelete = useCallback(
    async (friend: UserFriendListResponse_Friend) => {
      const diff = dayjs().diff(dayjs(friend.created_at * 1000), 'day');
      const diffString = diff === 0 ? '今天' : ` ${diff} 天前`;
      Alert.alert(
        '提示',
        `你与 ${friend.name} 在${diffString}成为好友，解除好友关系后，你们将无法再互相查看课表。确定要删除好友吗？`,
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
    ({ item, drag, isActive }: RenderItemParams<UserFriendListResponse[0]>) => (
      <ScaleDecorator>
        <View className="flex-row items-center justify-between py-4">
          {isManage && (
            <TouchableOpacity onPressIn={drag} disabled={isActive} className="mr-3 p-2">
              <Icon name="reorder-three-outline" size={24} />
            </TouchableOpacity>
          )}
          <View className="flex-1 gap-1">
            <Text className="text-lg font-medium">{item.name}</Text>
            <Text className="text-sm text-text-secondary">
              {item.grade}级 {item.college} {item.major}
            </Text>
          </View>
          {isManage && (
            <TouchableOpacity onPress={() => handleDelete(item)} className="p-2">
              <Icon name="trash-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </ScaleDecorator>
    ),
    [handleDelete, isManage],
  );

  const exitManage = useCallback(() => {
    if (orderChangedRef.current && orderedList.length > 0) {
      handleReorder(orderedList);
    }
    setIsManage(false);
  }, [orderedList, handleReorder]);

  const headerRight = useCallback(() => {
    if (friendList && friendList.length > 0) {
      return (
        <BorderlessButton
          onPress={() => {
            if (isManage) {
              exitManage();
            } else {
              setIsManage(true);
            }
          }}
        >
          <Text>{isManage ? '完成' : '管理'}</Text>
        </BorderlessButton>
      );
    }
    return null;
  }, [isManage, friendList, exitManage]);

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
            exitManage();
            return true;
          }

          return false;
        });

        return () => {
          subscription.remove();
        };
      }
    }, [isManage, exitManage]),
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
          content={
            <View className="flex-1">
              <DraggableFlatList
                data={orderedList}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${index}-${item.stu_id}`}
                contentContainerClassName="px-8"
                refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} enabled={!isManage} />}
                onDragEnd={({ data, from, to }) => {
                  if (from !== to) {
                    orderChangedRef.current = true;
                    setOrderedList(data);
                  }
                }}
              />
            </View>
          }
        />
        {orderedList.length > 0 && maxNumData && (
          <View className="mb-4 flex-row items-center justify-center gap-3 pt-1">
            <Text className="text-sm text-text-secondary">
              好友数量：{orderedList.length} / {maxNumData.max_num}
            </Text>
            <Text
              className="text-sm text-primary"
              onPress={() => pushToWebViewNormal('https://west2-online.feishu.cn/docx/WyKmdkR5foZHWJxwne2cOJGbnXd')}
            >
              提升上限
            </Text>
          </View>
        )}
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
