import Clipboard from '@react-native-clipboard/clipboard';
import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Share, View } from 'react-native';
import { toast } from 'sonner-native';

import { getApiV1UserFriendInvite, postApiV1UserFriendInviteCancel } from '@/api/generate';
import { CodeInput } from '@/components/code-input';
import MultiStateView from '@/components/multistateview/multi-state-view';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import useApiRequest from '@/hooks/useApiRequest';
import useMultiStateRequest from '@/hooks/useMultiStateRequest';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { DATETIME_SECOND_FORMAT } from '@/lib/constants';
import dayjs from 'dayjs';

export default function InviteFriendPage() {
  const { handleError } = useSafeResponseSolve();
  const [isRefresh, setIsRefresh] = useState(false);

  const apiResult = useApiRequest(getApiV1UserFriendInvite, { isRefresh: isRefresh }, {});
  const { data: inviteInfo, refetch } = apiResult;

  const { state } = useMultiStateRequest(apiResult);

  const handleRefresh = useCallback(() => {
    Alert.alert('提示', '重新生成邀请码将使当前邀请码失效，确认要重新生成吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: () => {
          setIsRefresh(true);
          refetch();
        },
      },
    ]);
  }, [refetch]);

  const handleCancel = useCallback(() => {
    Alert.alert('提示', '当前邀请码将立即失效，确认要取消吗？', [
      { text: '暂不', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          try {
            await postApiV1UserFriendInviteCancel();
            toast.success('邀请码已取消，进入页面可重新生成');
            router.back();
          } catch (error: any) {
            const data = handleError(error) as { message: string };
            if (data) {
              toast.error(data.message);
            }
          }
        },
      },
    ]);
  }, [handleError]);

  const handleShare = useCallback(async () => {
    if (inviteInfo?.invitation_code) {
      const shareUrl = `https://fzuhelperapp.west2.online/friend/invite?code=${inviteInfo.invitation_code}`;
      try {
        await Share.share({
          title: '邀请你成为我的福uu好友',
          message: `使用邀请码 ${inviteInfo.invitation_code} 成为我的福uu好友，共享我们的课表！ ${shareUrl}`,
        });
      } catch (e: any) {
        handleError(e);
      }
    }
  }, [handleError, inviteInfo?.invitation_code]);

  return (
    <>
      <Stack.Screen options={{ title: '我的邀请码' }} />

      <PageContainer>
        <MultiStateView
          state={state}
          refresh={refetch}
          content={
            <View className="mt-6 flex-1 px-6">
              <View className="items-center">
                <Text className="mb-10 text-center text-base text-text-secondary">
                  将此邀请码分享给好友，好友输入后双方即可共享课表
                </Text>

                <CodeInput value={inviteInfo?.invitation_code} editable={false} />

                <Text className="mt-6 text-sm text-text-secondary">
                  有效期至：
                  {inviteInfo?.expire_at ? dayjs(inviteInfo.expire_at * 1000).format(DATETIME_SECOND_FORMAT) : '--'}
                </Text>
                <Text className="mt-2 text-sm text-text-secondary">邀请码只能使用一次</Text>
              </View>

              <View className="mt-12 gap-4">
                <View className="flex-row gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => {
                      if (inviteInfo?.invitation_code) {
                        Clipboard.setString(inviteInfo.invitation_code);
                        toast.success('邀请码已复制到剪贴板');
                      }
                    }}
                  >
                    <Text>复制</Text>
                  </Button>
                  <Button variant="outline" className="flex-1" onPress={handleRefresh}>
                    <Text>重新生成</Text>
                  </Button>
                </View>

                <Button className="py-4" onPress={handleShare}>
                  <Text className="text-lg font-semibold">分享给好友</Text>
                </Button>

                <Button variant="ghost" onPress={handleCancel}>
                  <Text className="text-destructive">取消邀请</Text>
                </Button>
              </View>
            </View>
          }
        />
      </PageContainer>
    </>
  );
}
