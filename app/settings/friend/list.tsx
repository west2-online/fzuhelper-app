import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, BackHandler, FlatList, Modal, Platform, Pressable, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';

import { UserFriendListResponse } from '@/api/backend';
import { getApiV1UserFriendList, getApiV1UserFriendMaxNum, postApiV1UserFriendOpenApiDelete } from '@/api/generate';
import { HeaderIcon } from '@/components/HeaderIcon';
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
import { BorderlessButton } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

export default function FriendManagePage() {
  const { handleError } = useSafeResponseSolve();
  const insets = useSafeAreaInsets();

  const apiResult = useApiRequest(getApiV1UserFriendList, {}, { persist: true, queryKey: [FRIEND_LIST_KEY] });
  const { data: friendList, refetch } = apiResult;

  const { data: maxNumData } = useApiRequest(getApiV1UserFriendMaxNum, {});

  const [isManage, setIsManage] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const { state } = useMultiStateRequest(apiResult, {
    emptyCondition: data => !data || data.length === 0,
    onEmpty: () => setIsManage(false),
  });

  // 管理模式下根据待删除集合过滤列表，非管理模式直接使用 API 数据
  const displayList = useMemo(() => {
    if (!friendList) return [];
    if (isManage && pendingDeletes.size > 0) {
      return friendList.filter(f => !pendingDeletes.has(f.stu_id));
    }
    return friendList;
  }, [isManage, friendList, pendingDeletes]);

  const handleMarkDelete = useCallback((stuId: string) => {
    setPendingDeletes(prev => new Set(prev).add(stuId));
  }, []);

  const doDelete = useCallback(async () => {
    setIsSaving(true);
    try {
      for (const stuId of pendingDeletes) {
        await postApiV1UserFriendOpenApiDelete({ student_id: stuId });
      }
      toast.success(`成功删除 ${pendingDeletes.size} 位好友`);
      setPendingDeletes(new Set());
      setIsManage(false);
      refetch();
    } catch (error: any) {
      const data = handleError(error) as { message: string };
      if (data) {
        toast.error(data.message);
      }
    } finally {
      setIsSaving(false);
    }
  }, [pendingDeletes, handleError, refetch]);

  const handleSave = useCallback(() => {
    if (isSaving) return;
    if (pendingDeletes.size === 0) {
      setIsManage(false);
      return;
    }

    const deletedFriends = friendList?.filter(f => pendingDeletes.has(f.stu_id)) ?? [];
    const details = deletedFriends
      .map(f => {
        const days = dayjs().diff(dayjs(f.created_at * 1000), 'day');
        return `${f.name}（已成为好友 ${days} 天）`;
      })
      .join('\n');

    Alert.alert('确定要删除以下好友吗？', details, [
      { text: '放弃修改', style: 'cancel' },
      { text: '确定删除', style: 'destructive', onPress: doDelete },
    ]);
  }, [isSaving, pendingDeletes, friendList, doDelete]);

  const enterManage = useCallback(() => {
    setPendingDeletes(new Set());
    setIsManage(true);
  }, []);

  const handleDiscard = useCallback(() => {
    setPendingDeletes(new Set());
    setIsManage(false);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: UserFriendListResponse[0] }) => (
      <View className="flex-row items-center justify-between py-4">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-medium">{item.name}</Text>
          <Text className="text-sm text-text-secondary">
            {item.grade}级 {item.college} {item.major}
          </Text>
        </View>
        {isManage && (
          <TouchableOpacity onPress={() => handleMarkDelete(item.stu_id)} className="p-2">
            <Icon name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    ),
    [handleMarkDelete, isManage],
  );

  const headerRight = useCallback(
    () => (
      <View className="flex-row items-center gap-3">
        {!isManage && (
          <BorderlessButton onPress={() => setShowAddMenu(true)}>
            <HeaderIcon name="add-circle-outline" />
          </BorderlessButton>
        )}
        {friendList && friendList.length > 0 && (
          <BorderlessButton onPress={isManage ? handleSave : enterManage} enabled={!isSaving}>
            <HeaderIcon name={isManage ? 'checkmark' : 'settings-outline'} />
          </BorderlessButton>
        )}
      </View>
    ),
    [isManage, friendList, handleSave, enterManage, isSaving],
  );

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
            setPendingDeletes(new Set());
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

      {/* 添加好友下拉菜单 */}
      <Modal visible={showAddMenu} transparent animationType="fade" onRequestClose={() => setShowAddMenu(false)}>
        <Pressable className="flex-1" onPress={() => setShowAddMenu(false)}>
          <View
            className="absolute right-4 rounded-xl bg-popover p-1"
            style={{
              top: insets.top + HEADER_HEIGHT,
              elevation: 8,
              minWidth: 160,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            }}
          >
            <Pressable
              className="flex-row items-center gap-3 rounded-lg px-4 py-3 active:opacity-60"
              onPress={() => {
                setShowAddMenu(false);
                router.push('/settings/friend/invite');
              }}
            >
              <Icon name="person-outline" size={18} />
              <Text>我的邀请码</Text>
            </Pressable>
            <Pressable
              className="flex-row items-center gap-3 rounded-lg px-4 py-3 active:opacity-60"
              onPress={() => {
                setShowAddMenu(false);
                router.push('/settings/friend/add');
              }}
            >
              <Icon name="keypad-outline" size={18} />
              <Text>输入邀请码</Text>
            </Pressable>

            {friendList && maxNumData && (
              <View className="flex-col border-t border-border px-4 py-3">
                <View className="mb-1">
                  <Text className="text-sm text-text-secondary">
                    好友数量：{friendList.length} / {maxNumData.max_num}
                  </Text>
                </View>
                <View>
                  <Text
                    className="text-sm text-primary"
                    onPress={() => {
                      setShowAddMenu(false);
                      pushToWebViewNormal('https://west2-online.feishu.cn/docx/WyKmdkR5foZHWJxwne2cOJGbnXd');
                    }}
                  >
                    提升上限
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      <PageContainer>
        <MultiStateView
          state={state}
          refresh={refetch}
          className="flex-1"
          content={
            <FlatList
              data={displayList}
              renderItem={renderItem}
              keyExtractor={item => item.stu_id}
              contentContainerClassName="px-8"
            />
          }
        />
        {isManage && (
          <SafeAreaView edges={['bottom']} className="flex-row gap-4 px-6 pb-2">
            <Button variant="outline" onPress={handleDiscard} disabled={isSaving} className="flex-1">
              <Text>放弃</Text>
            </Button>
            <Button onPress={handleSave} disabled={isSaving} className="flex-1">
              <Text>{isSaving ? '保存中...' : '完成'}</Text>
            </Button>
          </SafeAreaView>
        )}
      </PageContainer>
    </>
  );
}
