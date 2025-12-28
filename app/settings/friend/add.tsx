import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { postApiV1UserFriendBind } from '@/api/generate';
import { CodeInput } from '@/components/code-input';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { FRIEND_INVITATION_CODE_LEN } from '@/lib/constants';

export default function FriendAddPage() {
  const { handleError } = useSafeResponseSolve();

  const [invitationCode, setInvitationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddFriend = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await postApiV1UserFriendBind({ invitation_code: invitationCode });
      toast.success('添加成功');
      router.back();
    } catch (error: any) {
      const data = handleError(error) as { message: string };
      if (data) {
        toast.error(data.message);
        setInvitationCode('');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [handleError, invitationCode]);

  return (
    <>
      <Stack.Screen
        options={{
          title: '输入邀请码',
        }}
      />

      <PageContainer className="flex-1 px-6">
        <View className="items-center">
          <Text className="mb-10 mt-6 text-center text-base text-text-secondary">
            请输入好友分享给你的{FRIEND_INVITATION_CODE_LEN}位邀请码
          </Text>

          <CodeInput value={invitationCode} onChangeText={setInvitationCode} />

          <Button
            className="mt-12 w-full py-4"
            onPress={handleAddFriend}
            disabled={isSubmitting || invitationCode.length !== FRIEND_INVITATION_CODE_LEN}
          >
            <Text className="text-lg font-semibold">{isSubmitting ? '添加中...' : '添加好友'}</Text>
          </Button>
        </View>
      </PageContainer>
    </>
  );
}
