import { LEARNING_CENTER_TOKEN_KEY } from '@/lib/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useRef } from 'react';
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

  // 处理 WebView 的导航状态变化
  const handleNavigationStateChange = async (navState: any) => {
    console.log('当前 WebView URL:', navState.url);
    // 根据需要对 url 进行处理，比如判断是否包含 token 参数
    // 目的url : https://aiot.fzu.edu.cn/ibs/#/?token=104c5be7-6ea2-42f4-8650-6096e8668fe5
    if (navState.url && navState.url.includes('token=')) {
      const extractedToken = extractTokenFromUrl(navState.url);

      // 如果提取到 token 并且 token 格式有效，则保存到本地并跳转到学习中心首页
      if (extractedToken) {
        await AsyncStorage.setItem(LEARNING_CENTER_TOKEN_KEY, extractedToken);
        router.back();
      }
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'SSO 网页登录',
        }}
      />
      <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1">
        <WebView
          ref={webViewRef}
          source={{ uri: GET_TOKEN_URL }}
          onError={() => {
            setTimeout(() => toast.error('网页加载失败'), 100);
          }}
          onNavigationStateChange={handleNavigationStateChange}
          cacheEnabled={false}
          incognito={true}
          thirdPartyCookiesEnabled={false}
        />
      </SafeAreaView>
    </>
  );
}
