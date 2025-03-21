import Constants from 'expo-constants';
import { Href, Link, Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListRow,
  DescriptionListTerm,
} from '@/components/DescriptionList';
import { Icon } from '@/components/Icon';
import PageContainer from '@/components/page-container';
import { Text } from '@/components/ui/text';

import IconTransparent from '@/assets/images/ic_launcher_foreground.png';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { URL_PRIVACY_POLICY, URL_USER_AGREEMENT } from '@/lib/constants';
import { pushToWebViewNormal } from '@/lib/webview';
import { checkAndroidUpdate, showAndroidUpdateDialog } from '@/utils/android-update';
import RedDot from '@/components/ui/red-dot';

const CLICK_TO_SHOW_DEVTOOLS = 7;

export default function AboutPage() {
  const [clickCount, setClickCount] = useState(0);
  const { handleError } = useSafeResponseSolve();
  const [updateCheckState, setUpdateCheckState] = useState('点击检查更新');

  const handleCheckUpdate = useCallback(async () => {
    console.log('check update');
    if (Platform.OS === 'ios') {
      Linking.openURL('itms-apps://itunes.apple.com/app/id866768101');
    } else {
      setUpdateCheckState('正在检查更新');

      checkAndroidUpdate(handleError, {
        onUpdate: data => {
          setUpdateCheckState('发现新版本');
          showAndroidUpdateDialog(data);
        },
        onNoUpdate: () => {
          setUpdateCheckState('已经是最新版本');
        },
        onError: error => {
          toast.error(error);
          setUpdateCheckState('检查更新失败，请稍后再试');
        },
      });
    }
  }, [handleError]);

  useEffect(() => {
    if (clickCount === CLICK_TO_SHOW_DEVTOOLS) {
      router.push('/devtools');
      setClickCount(0);
    }
  }, [clickCount]);

  return (
    <>
      <Stack.Screen options={{ title: '关于' }} />

      <PageContainer>
        <Pressable className="flex items-center p-12" onPress={() => setClickCount(prev => prev + 1)}>
          <Image source={IconTransparent} className="mb-6 h-20 w-20 rounded-full bg-card" />
          <View>
            <Text className="text-xl text-primary">{Constants.expoConfig?.version ?? ''}</Text>
          </View>
        </Pressable>

        <View className="flex-1 rounded-tr-4xl bg-card px-4 pt-8">
          <DescriptionList className="gap-6">
            <Pressable onPress={handleCheckUpdate}>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text className="text-text-secondary">版本更新</Text>
                </DescriptionListTerm>
                <DescriptionListDescription className="flex-row items-center">
                  <Text>{Platform.OS === 'ios' ? '点击前往 App Store 查看' : updateCheckState}</Text>
                  <RedDot right={90} top={6} />
                </DescriptionListDescription>
              </DescriptionListRow>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://site.west2.online/')}>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text className="text-text-secondary">研发团队</Text>
                </DescriptionListTerm>
                <DescriptionListDescription className="flex-row items-center">
                  <Text>西二在线工作室</Text>
                  <Icon name="chevron-forward" size={14} />
                </DescriptionListDescription>
              </DescriptionListRow>
            </Pressable>
            <Pressable onPress={() => router.push('/common/source-codes' as Href)}>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text className="text-text-secondary">项目源代码</Text>
                </DescriptionListTerm>
                <DescriptionListDescription className="flex-row items-center">
                  <Text>点击查看</Text>
                  <Icon name="chevron-forward" size={14} />
                </DescriptionListDescription>
              </DescriptionListRow>
            </Pressable>
          </DescriptionList>

          <SafeAreaView className="flex-1 items-center justify-end gap-2" edges={['bottom']}>
            <View className="flex-row">
              <Text className="text-primary" onPress={() => pushToWebViewNormal(URL_USER_AGREEMENT, '服务协议')}>
                服务协议
              </Text>
              <Text className="mx-3 text-primary">|</Text>
              <Text className="text-primary" onPress={() => pushToWebViewNormal(URL_PRIVACY_POLICY, '隐私政策')}>
                隐私政策
              </Text>
              <Text className="mx-3 text-primary">|</Text>
              <Link href="/contributors" asChild>
                <Text className="text-primary">贡献名录</Text>
              </Link>
            </View>
            <View className="flex-row">
              {/* 标准样式，请勿改动 */}
              <Text className="text-sm text-text-secondary">本APP由</Text>
              <Text
                className="text-sm text-primary"
                onPress={() => Linking.openURL('https://www.upyun.com/?utm_source=lianmeng&utm_medium=referral')}
              >
                又拍云
              </Text>
              <Text className="text-sm text-text-secondary">提供CDN加速/云存储服务</Text>
            </View>
            <Pressable className="flex-row items-center" onPress={() => Linking.openURL('https://beian.miit.gov.cn/')}>
              <Text className="mr-1 text-sm text-text-secondary">ICP备案号：闽ICP备19020557号-4A</Text>
              <Icon name="chevron-forward" size={10} />
            </Pressable>
            <Text className="text-center text-sm text-text-secondary">
              通过福州大学网络安全和信息化办公室安全质量检测
            </Text>
            <Text className="mb-6 text-center text-sm text-text-tertiary">
              Copyright &copy; 2017-{new Date().getFullYear()} west2-online. All Rights Reserved.
            </Text>
          </SafeAreaView>
        </View>
      </PageContainer>
    </>
  );
}
