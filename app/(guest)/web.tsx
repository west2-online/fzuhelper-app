import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Web() {
  const [canGoBack, setCanGoBack] = useState(false);
  const [webpageTitle, setWebpageTitle] = useState('');
  const [currentUrl, setCurrentUrl] = useState(''); // 当前加载的 URL
  const webViewRef = useRef<WebView>(null);

  // 读取传递的参数
  const { url, cookie, title } = useLocalSearchParams<{
    url: string;
    cookie?: string; // 可选的 cookie 参数
    title?: string; // 可选的 title 参数
  }>();

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

  // 将分号分隔的多个 Cookie 转换为注入的 JavaScript 代码
  const getCookieJavaScript = (cookieString: string | undefined) => {
    if (!cookieString) return undefined;

    // 将分号分隔的 Cookie 拆分为数组
    const cookies = cookieString.split(';');

    // 生成设置 Cookie 的 JavaScript 代码
    const cookieScript = cookies.map(c => `document.cookie = '${c.trim()}';`).join('\n');

    return cookieScript;
  };

  return (
    <>
      {/* 如果传递了 title 参数，则使用它；否则使用网页标题 */}
      <Stack.Screen options={{ title: title || webpageTitle }} />
      <WebView
        source={{ uri: currentUrl || url || '' }} // 使用当前 URL 或传递的 URL
        allowsBackForwardNavigationGestures={true} // iOS
        ref={webViewRef}
        onLoadProgress={event => {
          // Android
          setCanGoBack(event.nativeEvent.canGoBack);
        }}
        onNavigationStateChange={event => {
          if (!event.loading) {
            // 如果没有传递 title 参数，则更新网页标题
            if (!title) {
              setWebpageTitle(event.title);
            }
            // 更新当前 URL
            setCurrentUrl(event.url);
          }
        }}
        injectedJavaScript={getCookieJavaScript(cookie)} // 注入多个 Cookie
        onOpenWindow={onOpenWindow} // 处理新窗口打开事件
      />
    </>
  );
}
