import { useNavigation } from '@react-navigation/native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, FlatList, Platform, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';

import { UserFriendListResponse } from '@/api/backend';
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
import { BorderlessButton } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FriendManagePage() {
  const { handleError } = useSafeResponseSolve();
  const navigation = useNavigation();

  const apiResult = useApiRequest(getApiV1UserFriendList, {}, { persist: true, queryKey: [FRIEND_LIST_KEY] });
  const { data: friendList, refetch } = apiResult;

  const { state } = useMultiStateRequest(apiResult, {
    emptyCondition: data => !data || data.length === 0,
  });

  const [isManage, setIsManage] = useState(false);

  const handleDelete = useCallback(
    async (student_id: string) => {
      Alert.alert('提示', '确定要删除该好友吗？', [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await postApiV1UserFriendOpenApiDelete({ student_id });
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
      ]);
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
          <TouchableOpacity onPress={() => handleDelete(item.stu_id)} className="p-2">
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
