import Clipboard from '@react-native-clipboard/clipboard';
import * as Linking from 'expo-linking';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { toast } from 'sonner-native';

import { postApiV1UserFriendBind } from '@/api/generate';
import { CodeInput } from '@/components/code-input';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { FRIEND_INVITATION_CODE_LEN } from '@/lib/constants';

// 连续位数的大小写字母（实际应该是全大写，这里放宽）
function extractInvitationCode(text: string) {
  const matches = text.match(/[a-zA-Z]+/g);
  return matches?.find(c => c.length === FRIEND_INVITATION_CODE_LEN)?.toUpperCase();
}

export default function FriendAddPage() {
  const { handleError } = useSafeResponseSolve();

  const [invitationCode, setInvitationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  const { code } = useLocalSearchParams();

  const handleClipboard = useCallback(() => {
    Clipboard.getString().then(s => {
      console.log('Clipboard content:', s);
      const { scheme, hostname, queryParams } = Linking.parse(s);
      console.log('Parsed Clipboard URL:', { scheme, hostname, queryParams });
      let text = '';
      if (scheme === 'fzuhelper' && hostname === 'friend_invite' && queryParams?.code) {
        // 精确匹配
        text = queryParams.code as string;
      } else {
        // 尝试从剪贴板文本中提取邀请码
        text = s;
      }
      const validCode = extractInvitationCode(text);
      if (validCode) {
        setInvitationCode(validCode);
        toast.info('已从剪贴板读取邀请码');
      }
    });
  }, []);

  useEffect(() => {
    // 从DeepLink读取邀请码
    if (code && typeof code === 'string') {
      const validCode = extractInvitationCode(code);
      if (validCode) {
        setInvitationCode(validCode);
      } else {
        toast.error('邀请码无效');
      }
    }
    // 从剪贴板读取邀请码
    else {
      handleClipboard();
    }
  }, [code, handleClipboard]);

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

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        handleClipboard();
      }
      setAppState(nextAppState);
    });

    return () => subscription?.remove();
  }, [appState, handleClipboard]);

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
