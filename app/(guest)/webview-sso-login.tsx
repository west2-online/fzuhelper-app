import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { LEARNING_CENTER_TOKEN_KEY, SSO_LOGIN_COOKIE_DOMAIN, SSO_LOGIN_COOKIE_KEY } from '@/lib/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { toast } from 'sonner-native';

// 网页 SSO 登录，目前暂时不启用，同时只支持学习中心，实装前需要修改成兼容性更强的

const GET_TOKEN_URL =
  'https://sso.fzu.edu.cn/oauth2.0/authorize?response_type=code&client_id=wlwxt&redirect_uri=http://aiot.fzu.edu.cn/api/admin/sso/getIbsToken';

// token 格式:8-4-4-4-12
// const isTokenValid = (token: string): boolean => {
//   const tokenPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
//   return tokenPattern.test(token);
// };
const extractTokenFromUrl = (url: string): string | null => {
  const tokenMatch = url.match(/token=([^&]+)/);
  // 测试token是否合法
  const tokenPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (!tokenMatch || !tokenPattern.test(tokenMatch[1])) {
    toast.error('无效的学习空间预约令牌,请联系管理员');
    return null;
  }
  console.log('成功通过WebView登录到学习空间预约:', tokenMatch);
  return tokenMatch && tokenMatch[1] ? tokenMatch[1] : null;
};

export default function LearningCenterTokenPage() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const headerHeight = useHeaderHeight();

  // 处理 WebView 的导航状态变化
  const handleNavigationStateChange = useCallback(
    async (navState: any) => {
      console.log('当前 WebView URL:', navState.url);
      // 根据需要对 url 进行处理，比如判断是否包含 token 参数
      // 目的url : https://aiot.fzu.edu.cn/ibs/#/?token=104c5be7-6ea2-42f4-8650-6096e8668fe5
      if (navState.url && navState.url.includes('token=')) {
        const extractedToken = extractTokenFromUrl(navState.url);
        // 如果提取到 token 并且 token 格式有效，则证明登录成功，保存到本地，同时读取ssoCookie并保存
        if (extractedToken) {
          await AsyncStorage.setItem(LEARNING_CENTER_TOKEN_KEY, extractedToken);

          const cookies = await CookieManager.get(SSO_LOGIN_COOKIE_DOMAIN);
          const SOURCEID_TGC = cookies.SOURCEID_TGC.value;
          console.log('获取到的 SSO Cookie:', SOURCEID_TGC);
          await AsyncStorage.setItem(SSO_LOGIN_COOKIE_KEY, `SOURCEID_TGC=${SOURCEID_TGC}`);
          toast.success('登录成功');
          router.replace('/(tabs)'); // 跳转到首页
        }
      }
    },
    [router],
  );

  const renderLoading = useCallback(() => {
    return (
      <View className="absolute h-full w-full flex-1 items-center justify-center bg-background">
        <Loading />
      </View>
    );
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: '网页登录',
        }}
      />
      <PageContainer>
        <SafeAreaView edges={['bottom']} className="flex-1">
          <KeyboardAvoidingView behavior="padding" className="flex-1" keyboardVerticalOffset={headerHeight}>
            <WebView
              ref={webViewRef}
              source={{ uri: GET_TOKEN_URL }}
              onError={() => {
                setTimeout(() => toast.error('网页加载失败'), 100);
              }}
              onNavigationStateChange={handleNavigationStateChange}
              cacheEnabled={false}
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              overScrollMode="never"
              startInLoadingState={true}
              renderLoading={renderLoading}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </PageContainer>
    </>
  );
}
