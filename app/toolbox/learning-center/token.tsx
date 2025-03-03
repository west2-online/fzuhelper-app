import Loading from '@/components/loading';
import PageContainer from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import ssoLogin from '@/lib/sso-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { toast } from 'sonner-native';

const NAVIGATION_TITLE = '获取访问令牌';
export const TOKEN_STORAGE_KEY = 'learning_center_token';
const TOKEN_URL = 'https://aiot.fzu.edu.cn/api/ibs';

// token 格式:8-4-4-4-12
const isTokenValid = (token: string): boolean => {
  const tokenPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  return tokenPattern.test(token);
};

export default function LearningCenterTokenPage() {
  const navigation = useNavigation();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [showWebView, setShowWebView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const inputRef = useRef<any>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  useEffect(() => {
    const loadSavedToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (savedToken) {
          setToken(savedToken);
        }
      } catch {
        setTimeout(() => toast.error('加载令牌时出错'), 100);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedToken();
  }, []);

  const saveToken = async (newToken: string) => {
    if (!isTokenValid(newToken)) {
      setTimeout(() => toast.error('令牌格式无效，请重新输入'), 100);
      return false;
    }
    try {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      setToken(newToken);
      return true;
    } catch {
      setTimeout(() => toast.error('保存令牌时出错'), 100);
      return false;
    }
  };

  const handleNavigationStateChange = useCallback(
    (navState: any) => {
      const { url } = navState;
      if (url && url.includes('token=')) {
        const tokenMatch = url.match(/token=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
          const extractedToken = tokenMatch[1];
          saveToken(extractedToken).then(success => {
            if (success) {
              setShowWebView(false);
              router.replace('/toolbox/learning-center/token');
            }
          });
        }
      }
    },
    [router],
  );

  const handleGetToken = () => {
    const webView = webViewRef.current;
    if (webView) {
      webView.clearCache?.(true);
      webView.clearFormData?.();
    }
    setShowWebView(true);
  };

  const handleSaveAndNavigate = async () => {
    if (token) {
      const success = await saveToken(token);
      if (success) {
        router.replace('/toolbox/learning-center');
      }
    }
  };

  const handleTokenChange = (text: string) => {
    console.log('Input changed to:', text);
    setToken(text);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (showWebView) {
    return (
      <SafeAreaView className="flex-1" edges={['bottom', 'left', 'right']}>
        <WebView
          ref={webViewRef}
          source={{ uri: TOKEN_URL }}
          onNavigationStateChange={handleNavigationStateChange}
          onError={() => {
            setTimeout(() => toast.error('网页加载失败'), 100);
            setShowWebView(false);
          }}
          cacheEnabled={false}
          incognito={true}
          thirdPartyCookiesEnabled={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <PageContainer className="bg-background px-8 pt-4">
      <View className="space-y-6">
        <Button
          onPress={async () => {
            const sso = new ssoLogin();
            await sso.login('', ''); // 需要在这里提换你的学号和密码供测试
          }}
        >
          <Text>测试SSOLogin</Text>
        </Button>
        <Button
          onPress={async () => {
            const sso = new ssoLogin();
            await sso.getStudyToken();
          }}
        >
          <Text>测试学习空间</Text>
        </Button>
        <View className="space-y-2">
          <Text className="text-lg font-bold">学习中心令牌</Text>
          <Text className="text-base text-text-secondary">请输入或获取访问令牌</Text>
          <Text className="text-xs text-text-secondary">格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</Text>
        </View>

        <View className="space-y-4">
          <View className="space-y-2">
            <Text className="text-sm">令牌</Text>
            <Input
              ref={inputRef}
              value={token}
              onChangeText={handleTokenChange}
              placeholder="请输入令牌或点击下方按钮获取"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
            />
          </View>
          {token && (
            <View className="rounded-md border border-border p-4">
              <Text className="text-sm text-text-secondary">当前令牌</Text>
              <Text className="mt-1 text-base font-medium">{token}</Text>
            </View>
          )}
          <View className="space-y-2">
            <Button variant="outline" onPress={handleGetToken}>
              <Text>自动获取令牌</Text>
            </Button>
            {token && (
              <Button onPress={handleSaveAndNavigate}>
                <Text>保存并前往首页</Text>
              </Button>
            )}
            {token && (
              <Button
                onPress={() => {
                  setToken('');
                  AsyncStorage.removeItem(TOKEN_STORAGE_KEY)
                    .then(() => setTimeout(() => toast.success('令牌已清除'), 100))
                    .catch(() => setTimeout(() => toast.error('清除令牌时出错'), 100));
                }}
              >
                <Text>清除令牌</Text>
              </Button>
            )}
          </View>
        </View>
      </View>
    </PageContainer>
  );
}
