import Constants from 'expo-constants';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import { toast } from 'sonner-native';

export default function AboutPage() {
  const [clickCount, setClickCount] = useState(0);
  const { handleError } = useSafeResponseSolve();
  const [updateCheckState, setUpdateCheckState] = useState('点击检查更新');

  const handleCheckUpdate = async () => {
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
  };

  const handleOfficialWebsite = () => {
    Linking.openURL('https://site.west2.online/');
  };

  const handlePrivacyPolicy = () => {
    pushToWebViewNormal(URL_PRIVACY_POLICY, '隐私政策');
  };

  const handleUserAgreement = () => {
    pushToWebViewNormal(URL_USER_AGREEMENT, '服务协议');
  };

  const handleUpyun = () => {
    Linking.openURL('https://www.upyun.com/?utm_source=lianmeng&utm_medium=referral');
  };

  const handleBeian = () => {
    Linking.openURL('https://beian.miit.gov.cn/');
  };

  return (
    <>
      <Stack.Screen options={{ title: '关于' }} />

      <PageContainer>
        <Pressable
          className="flex items-center p-12"
          onPress={() => {
            setClickCount(clickCount + 1);
            if (clickCount === 5) {
              router.push('/devtools');
              setClickCount(0);
            }
          }}
        >
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
                <DescriptionListDescription>
                  <Text>{Platform.OS === 'ios' ? '点击前往 App Store 查看' : updateCheckState}</Text>
                </DescriptionListDescription>
              </DescriptionListRow>
            </Pressable>
            <DescriptionListRow>
              <DescriptionListTerm>
                <Text className="text-text-secondary">研发团队</Text>
              </DescriptionListTerm>
              <DescriptionListDescription>西二在线工作室</DescriptionListDescription>
            </DescriptionListRow>
            <Pressable onPress={handleOfficialWebsite}>
              <DescriptionListRow>
                <DescriptionListTerm>
                  <Text className="text-text-secondary">官方网站</Text>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Icon name="chevron-forward" size={14} />
                </DescriptionListDescription>
              </DescriptionListRow>
            </Pressable>
          </DescriptionList>

          <SafeAreaView className="flex-1 items-center justify-end gap-2" edges={['bottom']}>
            <View className="flex-row">
              <Text className="text-primary" onPress={handlePrivacyPolicy}>
                服务协议
              </Text>
              <Text className="mx-5 text-secondary">|</Text>
              <Text className="text-primary" onPress={handleUserAgreement}>
                隐私政策
              </Text>
            </View>
            <View className="flex-row">
              <Text className="text-center text-sm text-text-secondary">
                已通过福州大学网络安全和信息化办公室安全质量检测
              </Text>
            </View>
            <View className="flex-row">
              <Text className="text-sm text-text-secondary">由</Text>
              <Text className="text-sm text-primary" onPress={handleUpyun}>
                又拍云
              </Text>
              <Text className="text-sm text-text-secondary">提供 CDN 加速、云存储服务</Text>
            </View>
            <Pressable className="flex-row items-center" onPress={handleBeian}>
              <Text className="mr-1 text-sm text-text-secondary">闽ICP备19020557号-4A</Text>
              <Icon name="chevron-forward" size={10} />
            </Pressable>
            <Text className="mb-6 text-center text-sm text-text-tertiary">
              Copyright &copy; 2017-{new Date().getFullYear()} west2-online. All Rights Reserved.
            </Text>
          </SafeAreaView>
        </View>
      </PageContainer>
    </>
  );
}
