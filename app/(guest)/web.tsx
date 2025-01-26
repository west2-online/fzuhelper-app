import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

export default function Web() {
  const [canGoBack, setCanGoBack] = useState(false);
  const [webpageTitle, setWebpageTitle] = useState('');
  const [currentUrl, setCurrentUrl] = useState(''); // 当前加载的 URL
  const webViewRef = useRef<WebView>(null);

  // 读取传递的参数
  const { url, cookie, title } = useLocalSearchParams<{
    url: string; // URL 地址
    cookie?: string; // （可选）Cookie
    title?: string; // （可选）未 Loading 结束时的标题
  }>();

  const headers = cookie ? { Cookie: cookie } : [];

  const onAndroidBackPress = useCallback(() => {
    if (canGoBack) {
      webViewRef.current?.goBack();
      return true; // 阻止默认行为（退出应用）
    }
    return false;
  }, [canGoBack]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onAndroidBackPress);
      };
    }
  }, [onAndroidBackPress]);

  // 处理新窗口打开事件
  const onOpenWindow = (event: { nativeEvent: { targetUrl: any } }) => {
    const targetUrl = event.nativeEvent.targetUrl; // 获取目标 URL
    console.log('Opening new window with URL:', targetUrl);

    // 在当前 WebView 中加载目标 URL
    if (webViewRef.current) {
      setCurrentUrl(targetUrl); // 更新当前 URL
    }
  };

  // 处理新窗口打开事件
  const onShouldStartLoadWithRequest = (request: ShouldStartLoadRequest) => {
    // 检查是否是新窗口的请求
    if (request.navigationType === 'click' && request.url === '_blank') {
      console.log('Opening new window with URL:', request.url);

      // 在当前 WebView 中加载目标 URL
      setCurrentUrl(request.url);

      // 阻止默认加载行为
      return false;
    }

    // 允许加载其他请求
    return true;
  };

  return (
    <>
      {/* 如果传递了 title 参数，则使用它；否则使用网页标题 */}
      <Stack.Screen options={{ title: title || webpageTitle }} />
      <SafeAreaView className="h-full w-full" edges={['bottom']}>
        <WebView
          source={{ uri: currentUrl || url || '', headers: headers }} // 使用当前 URL 或传递的 URL
          allowsBackForwardNavigationGestures={true} // iOS
          ref={webViewRef}
          cacheEnabled={true}
          cacheMode={'LOAD_DEFAULT'}
          onLoadProgress={event => {
            // Android
            setCanGoBack(event.nativeEvent.canGoBack);
          }}
          onNavigationStateChange={event => {
            if (!event.loading) {
              // 更新当前 URL
              setCurrentUrl(event.url);

              // 更新网页标题
              console.log('event:', event);
              if (event.title && !title) {
                setWebpageTitle(event.title); // 只有在没有传递 title 参数时才更新标题
              }
            }
          }}
          onOpenWindow={onOpenWindow} // 处理新窗口打开事件
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        />
      </SafeAreaView>
      <Button onPress={() => onOpenWindow({ nativeEvent: { targetUrl: url } })}>
        <Text>Refresh</Text>
      </Button>
    </>
  );
}
